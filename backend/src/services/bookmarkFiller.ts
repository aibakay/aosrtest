/**
 * Fills Word bookmarks in a docx XML string by replacing the text content
 * inside each bookmarkStart/bookmarkEnd pair.
 *
 * Strategy: for each bookmark, find the first <w:t> run between
 * bookmarkStart and bookmarkEnd and replace its text. If the run has
 * formatting (w:rPr), we keep it; only the text changes.
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

    // Replace the first <w:t>…</w:t> found in this segment
    const newSegment = segment.replace(/<w:t(\s[^>]*)?>.*?<\/w:t>/, (match, attrs) => {
      const safeValue = escapeXml(value);
      const preserveAttr = safeValue !== value || value.startsWith(" ") || value.endsWith(" ")
        ? ' xml:space="preserve"'
        : (attrs ?? "");
      return `<w:t${preserveAttr}>${safeValue}</w:t>`;
    });

    xml = xml.slice(0, startMatch.index) + newSegment + xml.slice(endIdx + endTag.length);
  }
  return xml;
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
