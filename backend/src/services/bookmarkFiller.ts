/**
 * Fills Word bookmarks in a docx XML string by replacing the text content
 * inside each bookmarkStart/bookmarkEnd pair.
 *
 * Strategy: for each bookmark, find the first <w:t> run between
 * bookmarkStart and bookmarkEnd and replace its text. If the run has
 * formatting (w:rPr), we keep it; only the text changes. If the bookmark
 * spans no <w:t> at all (a "point" bookmark with nothing between start and
 * end — common for cells left blank in the original template), a new run
 * is inserted just before bookmarkEnd instead of the value being dropped.
 *
 * Any bookmark name present in `data` that can't actually be filled (not
 * found in the document, or a malformed start/end pair) is reported back
 * in `unresolved` rather than being silently skipped, so a caller can log
 * or surface it instead of shipping a document with missing text.
 */

export interface FillBookmarksResult {
  xml: string;
  /** Names from `data` that could not be located/filled in the document. */
  unresolved: string[];
}

const RUN_RE = /<w:t(\s[^>]*)?>.*?<\/w:t>/;

export function fillBookmarks(xml: string, data: Record<string, string>): FillBookmarksResult {
  let result = xml;
  const unresolved: string[] = [];

  for (const [name, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    // Find bookmarkStart with this name (lazy, handles any attribute order)
    const startRe = new RegExp(
      `<w:bookmarkStart[^>]*w:name="${escapeRegex(name)}"[^/]*/>`
    );
    const startMatch = startRe.exec(result);
    if (!startMatch) {
      unresolved.push(name);
      continue;
    }

    // Extract id from bookmarkStart
    const idMatch = /w:id="(\d+)"/.exec(startMatch[0]);
    if (!idMatch) {
      unresolved.push(name);
      continue;
    }
    const id = idMatch[1];

    const endTag = `<w:bookmarkEnd w:id="${id}"/>`;
    const endIdx = result.indexOf(endTag, startMatch.index);
    if (endIdx === -1) {
      unresolved.push(name);
      continue;
    }

    const segment = result.slice(startMatch.index, endIdx + endTag.length);

    let newSegment: string;
    if (RUN_RE.test(segment)) {
      // Replace the first <w:t>…</w:t> found in this segment.
      newSegment = segment.replace(RUN_RE, () => buildRunContent(value));
    } else {
      // Bookmark exists but wraps no text run (a "point" bookmark) —
      // insert a brand-new run just before bookmarkEnd instead of dropping
      // the value.
      const withoutEnd = segment.slice(0, segment.length - endTag.length);
      newSegment = `${withoutEnd}<w:r>${buildRunContent(value)}</w:r>${endTag}`;
    }

    result = result.slice(0, startMatch.index) + newSegment + result.slice(endIdx + endTag.length);
  }

  return { xml: result, unresolved };
}

/**
 * Builds the <w:t>/<w:br/> sequence for a (possibly multi-line) value.
 * Safe to drop directly inside an existing <w:r> or wrap in a new one.
 */
function buildRunContent(value: string): string {
  const lines = value.split("\n");
  return lines
    .map((line, i) => {
      const safe = escapeXml(line);
      const attr = line.startsWith(" ") || line.endsWith(" ") ? ' xml:space="preserve"' : "";
      const br = i < lines.length - 1 ? "<w:br/>" : "";
      return `<w:t${attr}>${safe}</w:t>${br}`;
    })
    .join("");
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
