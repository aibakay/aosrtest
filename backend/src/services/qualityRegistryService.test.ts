import { describe, it, expect } from "vitest";
import { parseAttachments, attachmentBookmarkKey, generateQualityRegistry } from "./qualityRegistryService";

describe("parseAttachments", () => {
  it("returns an empty array when no attachment field is present", () => {
    expect(parseAttachments({})).toEqual([]);
  });

  it("splits a newline-separated attachment field", () => {
    const result = parseAttachments({ приложения: "Документ А\nДокумент Б" });
    expect(result).toEqual(["Документ А", "Документ Б"]);
  });

  it("strips existing numbering prefixes", () => {
    const result = parseAttachments({ Приложения: "1. Документ А\n2) Документ Б" });
    expect(result).toEqual(["Документ А", "Документ Б"]);
  });

  it("filters blank lines", () => {
    const result = parseAttachments({ Приложения_АООК: "Документ А\n\n  \nДокумент Б" });
    expect(result).toEqual(["Документ А", "Документ Б"]);
  });

  it("checks bookmark aliases in priority order and stops at the first non-empty one", () => {
    const result = parseAttachments({ приложения: "", Приложения: "Только это" });
    expect(result).toEqual(["Только это"]);
  });
});

describe("attachmentBookmarkKey", () => {
  it("returns null when nothing is set", () => {
    expect(attachmentBookmarkKey({})).toBeNull();
  });

  it("returns the first matching bookmark key with a non-empty value", () => {
    expect(attachmentBookmarkKey({ Приложения: "x" })).toBe("Приложения");
  });
});

describe("generateQualityRegistry", () => {
  it("produces a non-empty docx buffer", () => {
    const buffer = generateQualityRegistry({
      actNumber: "12",
      actDate: "01 июля 2026",
      objectName: "Тестовый объект",
      items: ["Сертификат 1", "Сертификат 2"],
    });
    expect(buffer.length).toBeGreaterThan(0);
    // docx files are zip archives — must start with the local file header signature.
    expect(buffer.subarray(0, 2).toString("hex")).toBe("504b");
  });
});
