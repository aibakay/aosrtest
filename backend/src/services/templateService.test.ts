import { describe, it, expect } from "vitest";
import { splitDate, loadTemplates, getTemplatePath } from "./templateService";

describe("splitDate", () => {
  it("splits an ISO date into day/month(word)/year", () => {
    const result = splitDate("2026-07-01", "день", "месяц", "год");
    expect(result).toEqual({ день: "01", месяц: "июля", год: "2026" });
  });

  it("does not shift the day due to timezone (regression: was new Date(iso))", () => {
    // Midnight UTC parsed as local time in a negative-UTC-offset timezone
    // would previously roll back to the previous day.
    const result = splitDate("2026-01-01", "день", "месяц", "год");
    expect(result.день).toBe("01");
    expect(result.год).toBe("2026");
  });

  it("returns empty strings for an invalid/empty date", () => {
    expect(splitDate("", "д", "м", "г")).toEqual({ д: "", м: "", г: "" });
    expect(splitDate("not-a-date", "д", "м", "г")).toEqual({ д: "", м: "", г: "" });
  });

  it("returns empty strings for an out-of-range month", () => {
    expect(splitDate("2026-13-01", "д", "м", "г")).toEqual({ д: "", м: "", г: "" });
  });
});

describe("loadTemplates", () => {
  it("discovers at least one template with fields", () => {
    const templates = loadTemplates();
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      expect(t.code).toBeTruthy();
      expect(Array.isArray(t.fields)).toBe(true);
    }
  });

  it("resolves a path for every discovered template code", () => {
    const templates = loadTemplates();
    for (const t of templates) {
      expect(() => getTemplatePath(t.code)).not.toThrow();
    }
  });

  it("throws for an unknown template code", () => {
    expect(() => getTemplatePath("__does_not_exist__")).toThrow();
  });
});
