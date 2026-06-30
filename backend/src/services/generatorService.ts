import fs from "fs";
import PizZip from "pizzip";
import { GenerateRequest } from "../types";
import { getTemplatePath, splitDate } from "./templateService";
import { fillBookmarks } from "./bookmarkFiller";
import { DATE_SPLIT_RULES } from "../config/templates";
import { buildOrderDirectiveData } from "../config/orderDirectiveMapping";
import {
  parseAttachments,
  attachmentBookmarkKey,
  generateQualityRegistry,
} from "./qualityRegistryService";

const REGISTRY_THRESHOLD = 5;

export interface GenerateResult {
  buffer: Buffer;
  fileName: string;
  registryBuffer?: Buffer;
  registryFileName?: string;
}

export function generateDocument(req: GenerateRequest): GenerateResult {
  const templatePath = getTemplatePath(req.templateCode);
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  const data = {
    ...buildOrderDirectiveData(req.orderDirectives),
    ...expandDates(req.data),
  };

  // ── Quality-registry logic ────────────────────────────────────────────────
  const attachments = parseAttachments(data);
  let registryBuffer: Buffer | undefined;
  let registryFileName: string | undefined;

  if (attachments.length > REGISTRY_THRESHOLD) {
    const bookmarkKey = attachmentBookmarkKey(data);
    if (bookmarkKey) {
      data[bookmarkKey] = "Согласно реестру документов, подтверждающих качество (прилагается)";
    }
  } else if (attachments.length > 0) {
    // Auto-number attachment lines (1. … 2. …) for ≤5 items
    const bookmarkKey = attachmentBookmarkKey(data);
    if (bookmarkKey) {
      data[bookmarkKey] = attachments.map((item, i) => `${i + 1}. ${item}`).join("\n");
    }
  }

  if (attachments.length > REGISTRY_THRESHOLD) {

    const actNumber = data["Номер_акта"] ?? data["номер_акта"] ?? "";
    const actDate =
      data["Дата_акта_picker"] ??
      data["Дата_акта"] ??
      [data["день_а"], data["месяц_а"], data["год_а"]].filter(Boolean).join(" ") ??
      "";
    const objectName = data["Наименование_объекта"] ?? "";

    registryBuffer = generateQualityRegistry({
      actNumber,
      actDate,
      objectName,
      items: attachments,
    });

    const safeName = req.templateCode.replace(/[^\wЀ-ӿ-]/g, "_");
    registryFileName = `Реестр_документов_${safeName}_${Date.now()}.docx`;
  }
  // ─────────────────────────────────────────────────────────────────────────

  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Неверный формат шаблона: не найден word/document.xml");

  let xml = docFile.asText();
  xml = fillBookmarks(xml, data);
  zip.file("word/document.xml", xml);

  const safeName = req.templateCode.replace(/[^\wЀ-ӿ-]/g, "_");
  const fileName = `${safeName}_${Date.now()}.docx`;
  const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

  return { buffer, fileName, registryBuffer, registryFileName };
}

function expandDates(data: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = { ...data };
  for (const rule of DATE_SPLIT_RULES) {
    const pickerValue = data[rule.picker];
    if (pickerValue) {
      const parts = splitDate(pickerValue, rule.day, rule.month, rule.year);
      Object.assign(result, parts);
    }
  }
  return result;
}
