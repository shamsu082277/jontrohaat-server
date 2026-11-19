import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

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

test("invalid profile payload is rejected", async () => {
  const response = await request(app)
    .patch("/api/users/me")
    .set("Authorization", "Bearer invalid")
    .send({ role: "admin" });
  assert.equal(response.status, 401);
});

test("unknown route uses consistent 404 format", async () => {
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { success: false, message: "Route not found" });
});
