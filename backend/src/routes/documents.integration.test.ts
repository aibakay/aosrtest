import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { loadTemplates } from "../services/templateService";
import type { FieldDef } from "../types";

const app = createApp();

function fillValue(field: FieldDef): string {
  if (field.type === "date") return "2026-01-15";
  if (field.type === "number") return "1";
  return "Тестовое значение";
}

describe("GET /api/health", () => {
  it("reports ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/templates", () => {
  it("returns the discovered template list", async () => {
    const res = await request(app).get("/api/templates");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("POST /api/documents/generate", () => {
  it("rejects a request with no templateCode", async () => {
    const res = await request(app).post("/api/documents/generate").send({ data: {} });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeTruthy();
  });

  it("rejects an unknown templateCode", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .send({ templateCode: "__unknown__", data: {} });
    expect(res.status).toBe(400);
  });

  it("rejects a known template when required fields are missing", async () => {
    const [template] = loadTemplates();
    const res = await request(app)
      .post("/api/documents/generate")
      .send({ templateCode: template.code, data: {} });

    const hasRequiredField = template.fields.some((f) => f.required);
    if (hasRequiredField) {
      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    } else {
      expect(res.status).toBe(200);
    }
  });

  it("generates a real .docx for every discovered template when all fields are filled", async () => {
    const templates = loadTemplates();
    for (const template of templates) {
      const data: Record<string, string> = {};
      for (const field of template.fields) {
        data[field.name] = fillValue(field);
      }

      const res = await request(app)
        .post("/api/documents/generate")
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => callback(null, Buffer.concat(chunks)));
        })
        .send({ templateCode: template.code, data });

      expect(res.status, `${template.code}: ${JSON.stringify(res.body)}`).toBe(200);
      expect(res.headers["content-type"]).toMatch(
        /application\/(vnd\.openxmlformats-officedocument\.wordprocessingml\.document|zip)/
      );
      const buffer = res.body as Buffer;
      expect(buffer.length).toBeGreaterThan(0);
      // Both plain .docx and the .zip bundle (docx + quality registry) are
      // themselves zip archives — must start with the local file header signature.
      expect(buffer.subarray(0, 2).toString("hex")).toBe("504b");

      // No field the user actually filled in should silently vanish from the
      // document — the backend reports these via X-Unresolved-Bookmarks.
      expect(res.headers["x-unresolved-bookmarks"], `${template.code} has unresolved bookmarks`).toBeUndefined();
    }
  });
});
