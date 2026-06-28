/**
 * Fills Word bookmarks in a docx XML string by replacing the text content
 * inside each bookmarkStart/bookmarkEnd pair.
 *
 * Strategy: for each bookmark, write the value into the FIRST <w:t> run
 * between bookmarkStart and bookmarkEnd (preserving its formatting/attrs),
 * and clear the text of any remaining <w:t> runs in the same bookmark.
 * This handles placeholders that Word split across several runs — otherwise
 * leftover fragments of the old placeholder would remain in the document.
 */

export function fillBookmarks(xml: string, data: Record<string, string>): string {
  for (const [name, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    // Find bookmarkStart with this name (lazy, handles any attribute order)
    const startRe = new RegExp(
      `<w:bookmarkStart[^>]*w:name="${escapeRegex(name)}"[^/]*/>`
    );
    const startMatch = startRe.exec(xml);
    if (!startMatch) continue;

    // Extract id from bookmarkStart
    const idMatch = /w:id="(\d+)"/.exec(startMatch[0]);
    if (!idMatch) continue;
    const id = idMatch[1];

    const endTag = `<w:bookmarkEnd w:id="${id}"/>`;
    const endIdx = xml.indexOf(endTag, startMatch.index);
    if (endIdx === -1) continue;

    const segment = xml.slice(startMatch.index, endIdx + endTag.length);

    // Replace every <w:t>…</w:t> in the segment: first gets the value,
    // the rest are emptied so no old placeholder fragments survive.
    let first = true;
    const newSegment = segment.replace(
      /<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g,
      (_match, attrs: string | undefined) => {
        const text = first ? value : "";
        first = false;
        return buildTextNode(attrs, text);
      }
    );

    xml = xml.slice(0, startMatch.index) + newSegment + xml.slice(endIdx + endTag.length);
  }
  return xml;
}

/**
 * Builds a <w:t> node, preserving the original attributes and ensuring
 * xml:space="preserve" is present only when the value has leading/trailing
 * whitespace (escaped special characters do NOT require it).
 */
function buildTextNode(attrs: string | undefined, value: string): string {
  let attrStr = attrs ?? "";
  const needsPreserve = /^\s|\s$/.test(value);
  const hasPreserve = /xml:space\s*=/.test(attrStr);
  if (needsPreserve && !hasPreserve) {
    attrStr += ' xml:space="preserve"';
  }
  return `<w:t${attrStr}>${escapeXml(value)}</w:t>`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
