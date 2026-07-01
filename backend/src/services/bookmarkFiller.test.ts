import { describe, it, expect } from "vitest";
import { fillBookmarks } from "./bookmarkFiller";

function withBookmark(name: string, id: string, text: string): string {
  return (
    `<w:p><w:bookmarkStart w:id="${id}" w:name="${name}"/>` +
    `<w:r><w:t>${text}</w:t></w:r>` +
    `<w:bookmarkEnd w:id="${id}"/></w:p>`
  );
}

/** A "point" bookmark — start and end with nothing (no <w:t>) between them. */
function pointBookmark(name: string, id: string): string {
  return `<w:p><w:bookmarkStart w:id="${id}" w:name="${name}"/><w:bookmarkEnd w:id="${id}"/></w:p>`;
}

describe("fillBookmarks", () => {
  it("replaces the text inside a single-run bookmark", () => {
    const xml = withBookmark("Наименование_объекта", "1", "placeholder");
    const { xml: result, unresolved } = fillBookmarks(xml, { Наименование_объекта: "Новый текст" });
    expect(result).toContain("<w:t>Новый текст</w:t>");
    expect(result).not.toContain("placeholder");
    expect(unresolved).toEqual([]);
  });

  it("escapes XML special characters", () => {
    const xml = withBookmark("поле", "1", "x");
    const { xml: result } = fillBookmarks(xml, { поле: `<Tom & Jerry> "quoted"` });
    expect(result).toContain("&lt;Tom &amp; Jerry&gt; &quot;quoted&quot;");
  });

  it("preserves leading/trailing spaces via xml:space=preserve", () => {
    const xml = withBookmark("поле", "1", "x");
    const { xml: result } = fillBookmarks(xml, { поле: " со пробелами " });
    expect(result).toContain('xml:space="preserve"');
  });

  it("splits multi-line values into <w:t>/<w:br/> sequences", () => {
    const xml = withBookmark("приложения", "1", "x");
    const { xml: result } = fillBookmarks(xml, { приложения: "1. Первая\n2. Вторая" });
    expect(result).toContain("<w:t>1. Первая</w:t><w:br/><w:t>2. Вторая</w:t>");
  });

  it("reports a bookmark name not found in the document as unresolved, leaving the XML untouched", () => {
    const xml = withBookmark("другое_поле", "1", "unchanged");
    const { xml: result, unresolved } = fillBookmarks(xml, { отсутствует: "значение" });
    expect(result).toBe(xml);
    expect(unresolved).toEqual(["отсутствует"]);
  });

  it("ignores undefined/null values without marking them unresolved", () => {
    const xml = withBookmark("поле", "1", "unchanged");
    const { xml: result, unresolved } = fillBookmarks(xml, { поле: undefined as unknown as string });
    expect(result).toBe(xml);
    expect(unresolved).toEqual([]);
  });

  it("fills multiple distinct bookmarks in the same document", () => {
    const xml = withBookmark("поле_а", "1", "a") + withBookmark("поле_б", "2", "b");
    const { xml: result } = fillBookmarks(xml, { поле_а: "AAA", поле_б: "BBB" });
    expect(result).toContain("<w:t>AAA</w:t>");
    expect(result).toContain("<w:t>BBB</w:t>");
  });

  it("inserts a new run for a 'point' bookmark instead of silently dropping the value", () => {
    const xml = pointBookmark("пустое_поле", "1");
    const { xml: result, unresolved } = fillBookmarks(xml, { пустое_поле: "Вставленный текст" });
    expect(result).toContain("<w:r><w:t>Вставленный текст</w:t></w:r>");
    expect(result.indexOf("<w:r>")).toBeLessThan(result.indexOf("<w:bookmarkEnd"));
    expect(unresolved).toEqual([]);
  });

  it("inserts a multi-line run for a 'point' bookmark", () => {
    const xml = pointBookmark("пустое_поле", "1");
    const { xml: result } = fillBookmarks(xml, { пустое_поле: "Строка 1\nСтрока 2" });
    expect(result).toContain("<w:t>Строка 1</w:t><w:br/><w:t>Строка 2</w:t>");
  });
});
