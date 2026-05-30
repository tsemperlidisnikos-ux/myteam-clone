import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app.js";

describe("API health", () => {
  it("GET / returns ok", async () => {
    const res = await request(app).get("/");
    assert.equal(res.status, 200);
    assert.ok(res.body.message);
  });

  it("GET /health reports db", async () => {
    const res = await request(app).get("/health");
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.status);
  });
});

describe("Auth", () => {
  it("POST /auth/login rejects bad credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@test.com", password: "wrong" });
    assert.equal(res.status, 401);
  });

  it("POST /auth/forgot-password accepts email", async () => {
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "test@example.com" });
    assert.equal(res.status, 200);
    assert.ok(res.body.message);
  });

  it("POST /auth/register-parent rejects invalid code", async () => {
    const res = await request(app)
      .post("/auth/register-parent")
      .send({
        code: "INVALID",
        email: "parent@test.com",
        password: "test123",
        full_name: "Test Parent",
      });
    assert.equal(res.status, 400);
  });
});
