import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { TemplateDef, FieldDef, FieldType } from "../types";
import { FIELD_META, TEMPLATE_TITLES, DATE_SPLIT_RULES } from "../config/templates";

const TEMPLATES_DIR = path.join(__dirname, "../../templates");

// Russian month genitive forms
const MONTHS_RU = [
  "", "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря",
];

export function splitDate(isoDate: string, day: string, month: string, year: string): Record<string, string> {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return { [day]: "", [month]: "", [year]: "" };
  return {
    [day]:   String(d.getDate()).padStart(2, "0"),
    [month]: MONTHS_RU[d.getMonth() + 1],
    [year]:  String(d.getFullYear()),
  };
}

// Extract all non-internal bookmark names from a docx file
function extractBookmarks(filePath: string): string[] {
  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  const re = /w:bookmarkStart[^>]*w:name="([^"]+)"/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const name = m[1];
    if (!name.startsWith("_") && !name.startsWith("RANGE!")) {
      names.push(name);
    }
  }
  return [...new Set(names)];
}

// Determine whether a set of bookmarks needs date picker fields
function needsDatePicker(bookmarks: Set<string>, day: string): boolean {
  return bookmarks.has(day);
}

function buildFields(bookmarks: string[]): FieldDef[] {
  const bmSet = new Set(bookmarks);
  const fields: FieldDef[] = [];
  const seen = new Set<string>();

  // Inject date pickers before the day/month/year bookmark triplets
  for (const rule of DATE_SPLIT_RULES) {
    if (needsDatePicker(bmSet, rule.day)) {
      const meta = FIELD_META[rule.picker] ?? {
        label: rule.picker, type: "date" as FieldType, required: false, group: "Акт",
      };
      if (!seen.has(rule.picker)) {
        seen.add(rule.picker);
        fields.push({
          name: rule.picker,
          label: meta.label,
          type: "date",
          required: meta.required ?? false,
          group: meta.group ?? "Акт",
        });
      }
    }
  }

  // All remaining bookmarks (skip hidden day/month/year bookmarks — they come from pickers)
  const hiddenBookmarks = new Set(
    DATE_SPLIT_RULES.flatMap(r => [r.day, r.month, r.year])
  );

  for (const bm of bookmarks) {
    if (hiddenBookmarks.has(bm)) continue;
    if (seen.has(bm)) continue;
    seen.add(bm);

    const meta = FIELD_META[bm];
    fields.push({
      name: bm,
      label: meta?.label ?? bm,
      type: (meta?.type as FieldType) ?? "text",
      required: meta?.required ?? false,
      group: meta?.group ?? "Прочее",
    });
  }

  // Filter out _hidden group fields (internal only)
  return fields.filter(f => f.group !== "_hidden");
}

let _cache: TemplateDef[] | null = null;

export function loadTemplates(): TemplateDef[] {
  if (_cache) return _cache;

  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".docx"));
  const templates: TemplateDef[] = files.map(file => {
    const code = path.basename(file, ".docx");
    const filePath = path.join(TEMPLATES_DIR, file);
    const bookmarks = extractBookmarks(filePath);
    const fields = buildFields(bookmarks);
    const meta = TEMPLATE_TITLES[code] ?? { title: code, description: "" };
    return { code, title: meta.title, description: meta.description, fields };
  });

  // Sort by known order, then alphabetically
  const ORDER = ["АОСР","АОСР3","АОСР_старый","АООК","АООК_старый","АОУСИТО","АРООКС","АОГРОКС","АВК","АГИ","АИИО","АПрОб","ОтЭфД","Пролив","Промывка"];
  templates.sort((a, b) => {
    const ia = ORDER.indexOf(a.code);
    const ib = ORDER.indexOf(b.code);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.code.localeCompare(b.code, "ru");
  });

  _cache = templates;
  return templates;
}

export function getTemplatePath(code: string): string {
  const p = path.join(TEMPLATES_DIR, `${code}.docx`);
  if (!fs.existsSync(p)) throw new Error(`Шаблон не найден: ${code}`);
  return p;
}
