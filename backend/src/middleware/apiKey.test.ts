import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("apiKeyGate", () => {
  const ORIGINAL = process.env.API_KEY;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.API_KEY;
    else process.env.API_KEY = ORIGINAL;
  });

  it("allows requests through when API_KEY is unset (dev default)", async () => {
    delete process.env.API_KEY;
    const app = createApp();
    const res = await request(app).get("/api/templates");
    expect(res.status).toBe(200);
  });

  it("rejects requests missing the header when API_KEY is set", async () => {
    process.env.API_KEY = "secret-123";
    const app = createApp();
    const res = await request(app).get("/api/templates");
    expect(res.status).toBe(401);
  });

  it("rejects requests with the wrong key", async () => {
    process.env.API_KEY = "secret-123";
    const app = createApp();
    const res = await request(app).get("/api/templates").set("x-api-key", "wrong");
    expect(res.status).toBe(401);
  });

  it("allows requests with the correct key", async () => {
    process.env.API_KEY = "secret-123";
    const app = createApp();
    const res = await request(app).get("/api/templates").set("x-api-key", "secret-123");
    expect(res.status).toBe(200);
  });

  it("never gates /api/health, even when API_KEY is set", async () => {
    process.env.API_KEY = "secret-123";
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
