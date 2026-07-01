import { describe, it, expect } from "vitest";
import { isInForceOn, validateInput } from "./orderDirectiveService";
import type { OrderDirective, OrderDirectiveInput } from "../types";

function directive(overrides: Partial<OrderDirective> = {}): OrderDirective {
  return {
    id: "1",
    type: "order",
    number: "1",
    date: "2024-01-01",
    title: "Тест",
    responsiblePersonName: "Иванов И.И.",
    responsiblePersonPosition: "Прораб",
    role: "подрядчик",
    validFrom: "2024-01-01",
    validTo: null,
    organization: "ООО Тест",
    basisText: "",
    comment: "",
    isActive: true,
    ...overrides,
  };
}

describe("isInForceOn", () => {
  it("is false when the directive is inactive", () => {
    expect(isInForceOn(directive({ isActive: false }), "2025-01-01")).toBe(false);
  });

  it("is false before validFrom", () => {
    expect(isInForceOn(directive({ validFrom: "2025-06-01" }), "2025-01-01")).toBe(false);
  });

  it("is true on the exact validFrom date", () => {
    expect(isInForceOn(directive({ validFrom: "2025-01-01" }), "2025-01-01")).toBe(true);
  });

  it("is true indefinitely when validTo is null", () => {
    expect(isInForceOn(directive({ validFrom: "2020-01-01", validTo: null }), "2099-01-01")).toBe(true);
  });

  it("is true on the exact validTo date and false the day after", () => {
    const d = directive({ validFrom: "2024-01-01", validTo: "2024-12-31" });
    expect(isInForceOn(d, "2024-12-31")).toBe(true);
    expect(isInForceOn(d, "2025-01-01")).toBe(false);
  });
});

describe("validateInput", () => {
  const valid: OrderDirectiveInput = {
    type: "order",
    number: "1",
    date: "2024-01-01",
    title: "Тест",
    responsiblePersonName: "Иванов",
    responsiblePersonPosition: "Прораб",
    role: "подрядчик",
    validFrom: "2024-01-01",
    validTo: null,
    organization: "ООО",
    basisText: "",
    comment: "",
    isActive: true,
  };

  it("passes for a fully valid input", () => {
    expect(validateInput(valid)).toEqual([]);
  });

  it("flags missing required fields", () => {
    const errors = validateInput({ ...valid, number: "" });
    expect(errors.some((e) => e.field === "number")).toBe(true);
  });

  it("flags an invalid type", () => {
    const errors = validateInput({ ...valid, type: "bogus" as OrderDirectiveInput["type"] });
    expect(errors.some((e) => e.field === "type")).toBe(true);
  });

  it("flags validTo earlier than validFrom", () => {
    const errors = validateInput({ ...valid, validFrom: "2024-06-01", validTo: "2024-01-01" });
    expect(errors.some((e) => e.field === "validTo")).toBe(true);
  });
});
