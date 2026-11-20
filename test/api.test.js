import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import { bookingCreateSchema, profileSchema, roleSchema } from "../src/validators/schemas.js";

const app = createApp();

test("health reports database connectivity without credentials", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data.status, "ok");
  assert.equal(response.body.data.database, "disconnected");
  assert.doesNotMatch(JSON.stringify(response.body), /mongodb/i);
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
});

test("payment webhook is not acknowledged without configured Stripe secrets", async () => {
  const response = await request(app).post("/api/payments/webhook").set("Content-Type", "application/json").send("{}");
  assert.equal(response.status, 503);
});

test("unknown route uses consistent 404 format", async () => {
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { success: false, message: "Route not found" });
});
