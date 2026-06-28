import fs from "fs";
import os from "os";
import path from "path";
import PizZip from "pizzip";
import { GenerateRequest } from "../types";
import { getTemplatePath, splitDate } from "./templateService";
import { fillBookmarks } from "./bookmarkFiller";
import { DATE_SPLIT_RULES } from "../config/templates";

// On serverless (Vercel) the bundle filesystem is read-only — only the
// system tmp dir is writable. Locally we keep generated files in /backend/output.
const OUTPUT_DIR =
  process.env.OUTPUT_DIR ??
  (process.env.VERCEL ? path.join(os.tmpdir(), "output") : path.join(__dirname, "../../output"));

export function generateDocument(req: GenerateRequest): { buffer: Buffer; fileName: string } {
  const templatePath = getTemplatePath(req.templateCode);
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  const data = expandDates(req.data);

  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Неверный формат шаблона: не найден word/document.xml");

  let xml = docFile.asText();
  xml = fillBookmarks(xml, data);
  zip.file("word/document.xml", xml);

  const safeName = req.templateCode.replace(/[^\wЀ-ӿ-]/g, "_");
  const fileName = `${safeName}_${Date.now()}.docx`;
  const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });

  saveToOutput(fileName, buffer);

  return { buffer, fileName };
}

// Best-effort persistence: never let a write failure break generation.
function saveToOutput(fileName: string, buffer: Buffer): void {
  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), buffer);
  } catch (err) {
    console.warn(`Не удалось сохранить файл в ${OUTPUT_DIR}:`, String(err));
  }
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
