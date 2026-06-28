import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { GenerateRequest } from "../types";
import { getTemplatePath, splitDate } from "./templateService";
import { fillBookmarks } from "./bookmarkFiller";
import { DATE_SPLIT_RULES } from "../config/templates";

const OUTPUT_DIR = path.join(__dirname, "../../output");

export interface GenerateResult {
  filePath: string;
  fileName: string;
}

export function generateDocument(req: GenerateRequest): GenerateResult {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const templatePath = getTemplatePath(req.templateCode);
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  // Expand date pickers → day/month/year bookmarks
  const data = expandDates(req.data);

  // Fill bookmarks in document.xml
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Неверный формат шаблона: не найден word/document.xml");

  let xml = docFile.asText();
  xml = fillBookmarks(xml, data);
  zip.file("word/document.xml", xml);

  // Save to output
  const timestamp = Date.now();
  const safeName = req.templateCode.replace(/[^\wЀ-ӿ-]/g, "_");
  const fileName = `${safeName}_${timestamp}.docx`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  const buffer = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(filePath, buffer);

  return { filePath, fileName };
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
