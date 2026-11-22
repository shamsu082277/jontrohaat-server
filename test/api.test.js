import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import vercelApp from "../index.js";
import { env } from "../src/config/env.js";
import { serializeEquipment } from "../src/utils/serialize.js";
import {
  bookingCreateSchema,
  equipmentCreateSchema,
  equipmentUpdateSchema,
  profileSchema,
  roleSchema,
  statusSchema,
} from "../src/validators/schemas.js";

const app = createApp();

test("root confirms that the server is running", async () => {
  const response = await request(app).get("/");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "JontroHaat server is running",
    data: { status: "ok" },
  });
});

test("health reports current database connectivity without exposing credentials", async () => {
  const response = await request(app).get("/api/health");
  assert.ok([200, 503].includes(response.status));
  assert.equal(response.body.success, response.status === 200);
  assert.equal(response.body.data.status, "ok");
  assert.equal(response.body.data.database, response.status === 200 ? "connected" : "disconnected");
  if (response.status === 503) assert.doesNotMatch(JSON.stringify(response.body), /mongodb/i);
});

test("Vercel entry exports the Express app and preserves the health response", async () => {
  const response = await request(vercelApp).get("/api/health");
  assert.ok([200, 503].includes(response.status));
  assert.equal(response.body.data.database, response.status === 200 ? "connected" : "disconnected");
});

test("CORS allows a configured frontend origin", async () => {
  const origin = env.CLIENT_URL.split(",")[0].trim();
  const response = await request(app)
    .options("/api/health")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "GET");
  assert.equal(response.status, 204);
  assert.equal(response.headers["access-control-allow-origin"], origin);
});

test("missing bearer token is rejected", async () => {
  const response = await request(app).get("/api/favorites");
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { success: false, message: "Missing bearer token" });
});

test("owner and admin routes reject missing authentication", async () => {
  const owner = await request(app).get("/api/owner/analytics");
  const admin = await request(app).get("/api/admin/bookings");
  assert.equal(owner.status, 401);
  assert.equal(admin.status, 401);
});

test("invalid bearer token is rejected", async () => {
  const response = await request(app).get("/api/admin/analytics").set("Authorization", "Bearer invalid");
  assert.equal(response.status, 401);
});

test("request schemas reject protected fields and invalid booking details", () => {
  assert.equal(profileSchema.safeParse({ role: "admin" }).success, false);
  assert.equal(roleSchema.safeParse({ role: "superuser" }).success, false);
  assert.equal(bookingCreateSchema.safeParse({ equipmentId: "not-an-id", quantity: -1 }).success, false);
  assert.equal(statusSchema.safeParse({ status: "pending" }).success, true);
  assert.equal(statusSchema.safeParse({ status: "approved" }).success, true);
  assert.equal(statusSchema.safeParse({ status: "rejected" }).success, true);
  assert.equal(statusSchema.safeParse({ status: "published" }).success, false);
});

test("equipment image URLs accept HTTPS, normalize legacy image fields, and reject HTTP", () => {
  const listing = {
    title: "Test tractor",
    description: "A test equipment listing with enough detail.",
    category: "Tractors",
    location: { division: "Dhaka", district: "Dhaka" },
    rentalPrice: 100,
    rentalType: "per_day",
    securityDeposit: 0,
    availableQuantity: 1,
    condition: "Good",
    images: ["https://images.example.com/tractor.jpg", "https://cdn.example.com/tractor-side.jpg"],
  };
  const parsed = equipmentCreateSchema.safeParse(listing);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.deepEqual(parsed.data.images, listing.images);
    assert.equal(parsed.data.image, listing.images[0]);
  }

  const legacy = equipmentCreateSchema.safeParse({ ...listing, images: undefined, image: listing.images[0] });
  assert.equal(legacy.success, true);
  if (legacy.success) assert.deepEqual(legacy.data.images, [listing.images[0]]);

  assert.equal(equipmentCreateSchema.safeParse({ ...listing, images: ["http://images.example.com/tractor.jpg"] }).success, false);
  assert.equal(equipmentCreateSchema.safeParse({ ...listing, images: ["https://user:pass@images.example.com/tractor.jpg"] }).success, false);
  const titleOnlyUpdate = equipmentUpdateSchema.safeParse({ title: "Updated tractor" });
  assert.equal(titleOnlyUpdate.success, true);
  if (titleOnlyUpdate.success) {
    assert.equal("image" in titleOnlyUpdate.data, false);
    assert.equal("images" in titleOnlyUpdate.data, false);
  }
});

test("profile image URLs accept HTTPS only", () => {
  assert.equal(profileSchema.safeParse({ image: "https://cdn.example.com/profile.jpg" }).success, true);
  assert.equal(profileSchema.safeParse({ image: "http://cdn.example.com/profile.jpg" }).success, false);
  assert.equal(profileSchema.safeParse({ image: "https://user:pass@cdn.example.com/profile.jpg" }).success, false);
});

test("equipment serialization returns display fields without owner contact details", () => {
  const equipment = serializeEquipment({
    _id: "65f000000000000000000001",
    ownerId: "65f000000000000000000002",
    title: "Test tractor",
    rentalPrice: 1200,
    availableQuantity: 2,
    location: { division: "Dhaka", district: "Dhaka" },
    images: ["https://images.example.com/tractor.jpg"],
  }, {
    name: "Equipment owner",
    phone: "01712345678",
    email: "owner@example.com",
  });

  assert.equal(equipment.pricePerDay, 1200);
  assert.equal(equipment.quantity, 2);
  assert.equal(equipment.ownerName, "Equipment owner");
  assert.equal("ownerPhone" in equipment, false);
  assert.equal("ownerEmail" in equipment, false);
  assert.equal("phone" in equipment.owner, false);
  assert.equal("email" in equipment.owner, false);
});

test("payment webhook is not acknowledged without configured Stripe secrets", async () => {
  const response = await request(app).post("/api/payments/webhook").set("Content-Type", "application/json").send("{}");
  assert.equal(response.status, 503);
});

test("legacy file upload endpoint is no longer available", async () => {
  const response = await request(app).post("/api/uploads/image").send({});
  assert.equal(response.status, 404);
});

test("unknown route uses consistent 404 format", async () => {
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { success: false, message: "Route not found" });
});
