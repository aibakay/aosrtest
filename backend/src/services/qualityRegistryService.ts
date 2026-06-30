import PizZip from "pizzip";

export interface RegistryMeta {
  actNumber: string;
  actDate: string;
  objectName: string;
  items: string[];
}

// Build a minimal .docx containing the quality-documents registry table.
// No file template is required — the XML is generated entirely in code.
export function generateQualityRegistry(meta: RegistryMeta): Buffer {
  const zip = new PizZip();

  zip.file("[Content_Types].xml", contentTypes());
  zip.file("_rels/.rels", rootRels());
  zip.file("word/_rels/document.xml.rels", documentRels());
  zip.file("word/document.xml", documentXml(meta));

  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}

// ── Attachment parsing ────────────────────────────────────────────────────────

/** Possible bookmark names that hold the attachment list. */
export const ATTACHMENT_BOOKMARKS = ["приложения", "Приложения", "Приложения_АООК"] as const;

/**
 * Extract attachment items from the data map.
 * Splits the first non-empty attachment field by newline and filters blanks.
 */
export function parseAttachments(data: Record<string, string>): string[] {
  for (const key of ATTACHMENT_BOOKMARKS) {
    const value = data[key];
    if (value && value.trim()) {
      return value
        .split("\n")
        .map((l) => l.replace(/^\s*[\d]+[.)]\s*/, "").trim()) // strip leading numbers
        .filter(Boolean);
    }
  }
  return [];
}

/** Returns the bookmark key that contains the attachment list (first match). */
export function attachmentBookmarkKey(data: Record<string, string>): string | null {
  for (const key of ATTACHMENT_BOOKMARKS) {
    if (data[key]?.trim()) return key;
  }
  return null;
}

// ── Word XML helpers ──────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function para(text: string, bold = false, size = 24, center = false): string {
  const jc = center ? `<w:jc w:val="center"/>` : "";
  const b = bold ? "<w:b/>" : "";
  return `
  <w:p>
    <w:pPr>${jc}<w:spacing w:after="120"/></w:pPr>
    <w:r>
      <w:rPr>${b}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>
      <w:t xml:space="preserve">${esc(text)}</w:t>
    </w:r>
  </w:p>`;
}

function cell(text: string, bold = false, widthPct?: number): string {
  const w = widthPct
    ? `<w:tcW w:w="${Math.round(widthPct * 50)}" w:type="pct"/>`
    : "";
  const b = bold ? "<w:b/>" : "";
  return `
    <w:tc>
      <w:tcPr>${w}<w:tcBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
      </w:tcBorders></w:tcPr>
      <w:p>
        <w:pPr><w:spacing w:after="60"/></w:pPr>
        <w:r>
          <w:rPr>${b}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>
          <w:t xml:space="preserve">${esc(text)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
}

function tableRow(cells: Array<{ text: string; bold?: boolean; width?: number }>): string {
  return `<w:tr>${cells.map((c) => cell(c.text, c.bold, c.width)).join("")}</w:tr>`;
}

function documentXml(meta: RegistryMeta): string {
  const headerRow = tableRow([
    { text: "№", bold: true, width: 6 },
    { text: "Наименование документа", bold: true, width: 74 },
    { text: "Примечание", bold: true, width: 20 },
  ]);

  const dataRows = meta.items
    .map((item, i) =>
      tableRow([
        { text: String(i + 1), width: 6 },
        { text: item, width: 74 },
        { text: "", width: 20 },
      ])
    )
    .join("\n");

  const actRef = [
    meta.actNumber ? `к Акту № ${meta.actNumber}` : "",
    meta.actDate ? `от ${meta.actDate}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp wpg wpc wpi wps">
  <w:body>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`.replace(
    "<w:body>",
    `<w:body>
    ${para("РЕЕСТР документов, подтверждающих качество", true, 28, true)}
    ${actRef ? para(actRef, false, 22, true) : ""}
    ${meta.objectName ? para(`Объект: ${meta.objectName}`, false, 22) : ""}
    ${para("")}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
        </w:tblBorders>
      </w:tblPr>
      ${headerRow}
      ${dataRows}
    </w:tbl>
    ${para("")}`
  );
}

function contentTypes(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
}

function rootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;
}

function documentRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
}
