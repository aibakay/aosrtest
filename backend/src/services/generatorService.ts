import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { GenerateRequest } from "../types";
import { getTemplatePath, splitDate } from "./templateService";
import { fillBookmarks } from "./bookmarkFiller";
import { DATE_SPLIT_RULES } from "../config/templates";
import { buildOrderDirectiveData, additiveOrderDirectiveKeys } from "../config/orderDirectiveMapping";
import {
  parseAttachments,
  attachmentBookmarkKey,
  generateQualityRegistry,
} from "./qualityRegistryService";

const REGISTRY_THRESHOLD = 5;
const OUTPUT_DIR = path.join(__dirname, "../../output");

/**
 * Keep a copy of every generated document on disk, per the project's
 * Definition of Done ("save generated files to /backend/output"). Best
 * effort — a write failure (e.g. read-only filesystem on some deploy
 * targets) must not stop the document from reaching the user, since the
 * response buffer is what actually matters. Skipped in tests so the test
 * suite doesn't litter the output directory on every run.
 */
function saveToOutput(fileName: string, buffer: Buffer): void {
  if (process.env.NODE_ENV === "test") return;
  try {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), buffer);
  } catch (err) {
    console.warn(`[generatorService] Не удалось сохранить копию в output: ${fileName}`, err);
  }
}

// Virtual "picker" field names (Дата_акта_picker, etc.) are UI-only — they
// feed expandDates() to produce the real день/месяц/год bookmarks and are
// never bookmarks themselves, so they must not be flagged as unresolved.
const PICKER_KEYS = new Set(DATE_SPLIT_RULES.map((r) => r.picker));

export interface GenerateResult {
  buffer: Buffer;
  fileName: string;
  registryBuffer?: Buffer;
  registryFileName?: string;
  /**
   * Bookmark names the caller submitted data for that could not actually be
   * located/filled in the template. Excludes the order-directive "Приказ_*"
   * placeholder keys (known-additive, see docs/TEMPLATES.md) and the virtual
   * date-picker keys (UI-only, never real bookmarks — see PICKER_KEYS).
   */
  unresolvedBookmarks: string[];
}

export function generateDocument(req: GenerateRequest): GenerateResult {
  const templatePath = getTemplatePath(req.templateCode);
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  const orderData = buildOrderDirectiveData(req.orderDirectives);
  const additiveKeys = additiveOrderDirectiveKeys(req.orderDirectives);

  const data = {
    ...orderData,
    ...expandDates(req.data),
  };

  const safeName = req.templateCode.replace(/[^\wЀ-ӿ-]/g, "_");

  // ── Quality-registry logic ────────────────────────────────────────────────
  const attachments = parseAttachments(data);
  let registryBuffer: Buffer | undefined;
  let registryFileName: string | undefined;
  const needsRegistry = attachments.length > REGISTRY_THRESHOLD;

  if (needsRegistry) {
    const bookmarkKey = attachmentBookmarkKey(data);
    if (bookmarkKey) {
      data[bookmarkKey] = "Согласно реестру документов, подтверждающих качество (прилагается)";
    }

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
    registryFileName = `Реестр_документов_${safeName}_${Date.now()}.docx`;
  } else if (attachments.length > 0) {
    // Auto-number attachment lines (1. … 2. …) for ≤5 items
    const bookmarkKey = attachmentBookmarkKey(data);
    if (bookmarkKey) {
      data[bookmarkKey] = attachments.map((item, i) => `${i + 1}. ${item}`).join("\n");
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Неверный формат шаблона: не найден word/document.xml");

  const { xml: filledXml, unresolved } = fillBookmarks(docFile.asText(), data);
  zip.file("word/document.xml", filledXml);

  const unresolvedBookmarks = unresolved.filter(
    (name) => !additiveKeys.has(name) && !PICKER_KEYS.has(name)
  );
  if (unresolvedBookmarks.length > 0) {
    console.warn(
      `[generatorService] Шаблон "${req.templateCode}": не удалось заполнить закладки: ${unresolvedBookmarks.join(", ")}`
    );
  }

  const fileName = `${safeName}_${Date.now()}.docx`;
  const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

  saveToOutput(fileName, buffer);
  if (registryBuffer && registryFileName) saveToOutput(registryFileName, registryBuffer);

  return { buffer, fileName, registryBuffer, registryFileName, unresolvedBookmarks };
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
