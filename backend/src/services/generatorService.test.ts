import { describe, it, expect } from "vitest";
import { generateDocument } from "./generatorService";
import { loadTemplates } from "./templateService";
import type { FieldDef, OrderDirective, SelectedOrderDirective } from "../types";

function fillValue(field: FieldDef): string {
  if (field.type === "date") return "2026-01-15";
  if (field.type === "number") return "1";
  return "Тестовое значение";
}

function directive(overrides: Partial<OrderDirective> = {}): OrderDirective {
  return {
    id: "1",
    type: "order",
    number: "45",
    date: "2024-06-01",
    title: "Тест",
    responsiblePersonName: "Петров Пётр Петрович",
    responsiblePersonPosition: "Производитель работ",
    role: "ответственное лицо за производство работ",
    validFrom: "2024-06-01",
    validTo: null,
    organization: "ООО Тест",
    basisText: "",
    comment: "",
    isActive: true,
    ...overrides,
  };
}

describe("generateDocument — unresolvedBookmarks", () => {
  it("is empty when every submitted field has a matching bookmark", () => {
    const template = loadTemplates()[0];
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);

    const result = generateDocument({ templateCode: template.code, data });
    expect(result.unresolvedBookmarks).toEqual([]);
  });

  it("does not flag order-directive 'Приказ_*' placeholder keys as unresolved", () => {
    // These keys are known-additive (no template has a bookmark for them yet
    // — see docs/TEMPLATES.md) and must not trigger a false-positive warning.
    const template = loadTemplates()[0];
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);

    const selected: SelectedOrderDirective[] = [
      { role: "ответственное лицо за производство работ", directive: directive() },
    ];

    const result = generateDocument({ templateCode: template.code, data, orderDirectives: selected });
    const flaggedPrikaz = result.unresolvedBookmarks.filter((k) => k.startsWith("Приказ_"));
    expect(flaggedPrikaz).toEqual([]);
  });

  it("flags a genuinely unknown bookmark name submitted in data", () => {
    const template = loadTemplates()[0];
    const data: Record<string, string> = {};
    for (const field of template.fields) data[field.name] = fillValue(field);
    data["__не_существующая_закладка__"] = "значение";

    const result = generateDocument({ templateCode: template.code, data });
    expect(result.unresolvedBookmarks).toContain("__не_существующая_закладка__");
  });
});
