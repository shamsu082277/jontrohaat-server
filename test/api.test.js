import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
import vercelApp from "../index.js";
import { env } from "../src/config/env.js";
import { bookingCreateSchema, profileSchema, roleSchema } from "../src/validators/schemas.js";

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
