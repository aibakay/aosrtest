import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app";
import { registryRepository } from "../repositories/registryRepository";
import { loadTemplates } from "../services/templateService";
import type { FieldDef } from "../types";

const app = createApp();

function fillValue(field: FieldDef): string {
  if (field.type === "date") return "2026-01-15";
  if (field.type === "number") return "1";
  return "Тестовое значение";
}

// Registries created during these tests are tracked here and removed in
// afterEach so the suite leaves backend/data/registries.json exactly as it
// found it, regardless of which assertion (if any) fails.
const createdIds: string[] = [];

afterEach(() => {
  for (const id of createdIds.splice(0)) {
    registryRepository.remove(id);
  }
});

async function createTestRegistry(): Promise<string> {
  const res = await request(app)
    .post("/api/registries")
    .send({ name: `__test_registry_${Date.now()}__` });
  createdIds.push(res.body.id);
  return res.body.id as string;
}

describe("POST /api/registries/:id/acts — validation", () => {
  it("rejects an act missing required fields for its template", async () => {
    const registryId = await createTestRegistry();
    const [template] = loadTemplates();

    const res = await request(app)
      .post(`/api/registries/${registryId}/acts`)
      .send({ templateCode: template.code, data: {} });

    const hasRequiredField = template.fields.some((f) => f.required);
    if (hasRequiredField) {
      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    } else {
      expect(res.status).toBe(201);
    }
  });

  it("accepts an act with all required fields filled", async () => {
    const registryId = await createTestRegistry();
    const [template] = loadTemplates();
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);

    const res = await request(app)
      .post(`/api/registries/${registryId}/acts`)
      .send({ templateCode: template.code, data });

    expect(res.status).toBe(201);
    expect(res.body.items.length).toBe(1);
  });
});

describe("PUT /api/registries/:id/acts/:actId — validation", () => {
  it("rejects clearing a required field via update", async () => {
    const registryId = await createTestRegistry();
    const [template] = loadTemplates();
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);

    const created = await request(app)
      .post(`/api/registries/${registryId}/acts`)
      .send({ templateCode: template.code, data });
    const actId = created.body.items[0].id;

    const requiredField = template.fields.find((f) => f.required);
    if (!requiredField) return; // template has no required fields — nothing to test here

    const res = await request(app)
      .put(`/api/registries/${registryId}/acts/${actId}`)
      .send({ data: { ...data, [requiredField.name]: "" } });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe("POST /api/registries/:id/generate — partial failure handling", () => {
  it("returns 422 with failure details when every act fails to generate", async () => {
    const registryId = await createTestRegistry();

    // Inject a broken act directly (bypassing route validation) to simulate
    // a template that was later removed from disk — the one failure mode
    // that can't be caught at save time.
    const reg = registryRepository.getById(registryId)!;
    registryRepository.update(registryId, {
      items: [
        {
          id: "broken-act-1",
          templateCode: "__nonexistent_template__",
          data: {},
          orderDirectives: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });
    void reg;

    const res = await request(app).post(`/api/registries/${registryId}/generate`);

    expect(res.status).toBe(422);
    expect(res.body.failures).toHaveLength(1);
    expect(res.body.failures[0].actId).toBe("broken-act-1");
  });

  it("generates a ZIP with the successful acts and reports failures via header when some acts fail", async () => {
    const registryId = await createTestRegistry();
    const [template] = loadTemplates();
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);

    registryRepository.update(registryId, {
      items: [
        {
          id: "good-act-1",
          templateCode: template.code,
          data,
          orderDirectives: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: "broken-act-2",
          templateCode: "__nonexistent_template__",
          data: {},
          orderDirectives: [],
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const res = await request(app)
      .post(`/api/registries/${registryId}/generate`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/zip/);

    const warningsHeader = res.headers["x-registry-warnings"];
    expect(warningsHeader).toBeTruthy();
    const failures = JSON.parse(decodeURIComponent(warningsHeader));
    expect(failures).toHaveLength(1);
    expect(failures[0].actId).toBe("broken-act-2");

    const buffer = res.body as Buffer;
    expect(buffer.subarray(0, 2).toString("hex")).toBe("504b");
  });
});
