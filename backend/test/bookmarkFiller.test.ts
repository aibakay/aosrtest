import assert from "node:assert/strict";
import { test } from "node:test";
import { fillBookmarks } from "../src/services/bookmarkFiller";

function bm(name: string, id: number, text: string): string {
  return (
    `<w:bookmarkStart w:id="${id}" w:name="${name}"/>` +
    `<w:r><w:t>${text}</w:t></w:r>` +
    `<w:bookmarkEnd w:id="${id}"/>`
  );
}

test("fills a simple bookmark", () => {
  const xml = bm("Номер_акта", 1, "0");
  const out = fillBookmarks(xml, { Номер_акта: "42" });
  assert.match(out, /<w:t>42<\/w:t>/);
});

test("escapes XML special characters", () => {
  const xml = bm("Объект", 1, "x");
  const out = fillBookmarks(xml, { Объект: 'ООО "Рога" & <Копыта>' });
  assert.match(out, /ООО &quot;Рога&quot; &amp; &lt;Копыта&gt;/);
});

test("does NOT add xml:space for escaped chars without surrounding whitespace", () => {
  const xml = bm("F", 1, "x");
  const out = fillBookmarks(xml, { F: "a&b" });
  assert.doesNotMatch(out, /xml:space/);
});

test("adds xml:space=preserve for leading/trailing whitespace", () => {
  const xml = bm("F", 1, "x");
  const out = fillBookmarks(xml, { F: " пробел " });
  assert.match(out, /<w:t xml:space="preserve"> пробел <\/w:t>/);
});

test("preserves existing run attributes", () => {
  const xml =
    `<w:bookmarkStart w:id="1" w:name="F"/>` +
    `<w:r><w:t xml:space="preserve">old</w:t></w:r>` +
    `<w:bookmarkEnd w:id="1"/>`;
  const out = fillBookmarks(xml, { F: "new" });
  assert.match(out, /<w:t xml:space="preserve">new<\/w:t>/);
});

test("clears leftover fragments when placeholder spans multiple runs", () => {
  const xml =
    `<w:bookmarkStart w:id="1" w:name="F"/>` +
    `<w:r><w:t>Hello</w:t></w:r>` +
    `<w:r><w:t>World</w:t></w:r>` +
    `<w:bookmarkEnd w:id="1"/>`;
  const out = fillBookmarks(xml, { F: "Value" });
  assert.match(out, /<w:t>Value<\/w:t>/);
  assert.doesNotMatch(out, /Hello/);
  assert.doesNotMatch(out, /World/);
});

test("ignores unknown bookmarks without throwing", () => {
  const xml = bm("F", 1, "x");
  const out = fillBookmarks(xml, { Nonexistent: "y" });
  assert.equal(out, xml);
});

test("skips null/undefined values", () => {
  const xml = bm("F", 1, "keep");
  const out = fillBookmarks(xml, { F: undefined as unknown as string });
  assert.match(out, /keep/);
});
