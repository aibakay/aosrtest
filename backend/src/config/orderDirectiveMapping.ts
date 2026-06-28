import { SelectedOrderDirective } from "../types";

/**
 * Mapping layer: selected order/directive (by role) → Word data keys.
 *
 * Produces two layers of data per selected directive:
 *
 * 1. Dedicated "Приказ_*" keys — will populate once a matching bookmark is
 *    added to a template (currently templates lack these — see docs/TEMPLATES.md).
 *    These keys are always emitted and are harmless when the bookmark is absent.
 *
 * 2. Standard person bookmarks that ALREADY EXIST in the templates
 *    (e.g. ФИО_Пд, Должность_Пд, Должность_ФИО_Подрядчика).
 *    These populate immediately with no template changes needed.
 *    User-supplied form values take precedence (see generatorService.ts merge order).
 */

// ── 1. Dedicated prefix keys ─────────────────────────────────────────────
const ROLE_PREFIX: Record<string, string> = {
  "заказчик":                               "Приказ_Заказчик",
  "строительный контроль":                  "Приказ_СтройКонтроль",
  "подрядчик":                              "Приказ_Подрядчик",
  "генподрядчик":                           "Приказ_Генподрядчик",
  "проектировщик":                          "Приказ_Проектировщик",
  "лицо, выполнившее работы":               "Приказ_ЛицоВыполнившее",
  "ответственное лицо за производство работ": "Приказ_ОтветственноеЛицо",
};

function slugify(role: string): string {
  return "Приказ_" + role.replace(/[^0-9A-Za-zА-Яа-яЁё]+/g, "_").replace(/^_+|_+$/g, "");
}

function docLabel(typeRu: string, number: string, date: string): string {
  return `${typeRu} № ${number}${date ? ` от ${date}` : ""}`;
}

// ── 2. Standard person bookmarks that already exist in the templates ──────
//
// Each role maps to:
//   positionField — "Должность_X" bookmark (construction acts)
//   nameField     — "ФИО_X"      bookmark (construction acts)
//   combinedField — "Должность_ФИО_X" bookmark (simple acts; value = "Должность ФИО")
//
// Rules:
// • "строительный контроль"  → ТНЗ (тех.надзор заказчика) — person from customer side
// • "заказчик"               → only Должность_ФИО_Застройщика (simple acts);
//                               NOT ТНЗ (that's the tech-control rep, not the org head)
// • Roles sharing the same bookmark (подрядчик / лицо выполнившее / ответ. лицо):
//   the last processed wins, but in practice only one such role is selected per doc.
interface PersonBookmarks {
  positionField?: string;
  nameField?: string;
  combinedField?: string;
}

const ROLE_BOOKMARK_MAP: Record<string, PersonBookmarks> = {
  "строительный контроль": {
    positionField: "Должность_ТНЗ",
    nameField:     "ФИО_ТНЗ",
  },
  "заказчик": {
    combinedField: "Должность_ФИО_Застройщика",
  },
  "генподрядчик": {
    positionField: "Должность_Г",
    nameField:     "ФИО_Г",
    combinedField: "Должность_ФИО_Генподрядчика",
  },
  "подрядчик": {
    positionField: "Должность_Пд",
    nameField:     "ФИО_Пд",
    combinedField: "Должность_ФИО_Подрядчика",
  },
  "проектировщик": {
    positionField: "Должность_Пр",
    nameField:     "ФИО_Пр",
    combinedField: "Должность_ФИО_Проектировщика",
  },
  "лицо, выполнившее работы": {
    positionField: "Должность_Пд",
    nameField:     "ФИО_Пд",
  },
  "ответственное лицо за производство работ": {
    positionField: "Должность_Пд",
    nameField:     "ФИО_Пд",
  },
};

/**
 * Turn the chosen directives into flat data keys that get merged into the
 * generation payload before bookmark filling.
 *
 * Merge precedence in generatorService: user form data > this output,
 * so if a user filled "ФИО_Пд" manually it is never overwritten here.
 */
export function buildOrderDirectiveData(
  selected: SelectedOrderDirective[] | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!selected?.length) return out;

  for (const item of selected) {
    const d = item.directive;
    if (!d) continue;

    // Layer 1 — dedicated Приказ_* keys
    const prefix = ROLE_PREFIX[item.role] ?? slugify(item.role);
    const typeRu  = d.type === "directive" ? "Распоряжение" : "Приказ";
    const document = docLabel(typeRu, d.number, d.date);

    out[prefix]                   = d.basisText?.trim() ? d.basisText : document;
    out[`${prefix}_ФИО`]          = d.responsiblePersonName ?? "";
    out[`${prefix}_Должность`]    = d.responsiblePersonPosition ?? "";
    out[`${prefix}_Документ`]     = document;

    // Layer 2 — existing template bookmarks
    const bm = ROLE_BOOKMARK_MAP[item.role];
    if (bm) {
      if (bm.positionField) out[bm.positionField] = d.responsiblePersonPosition ?? "";
      if (bm.nameField)     out[bm.nameField]     = d.responsiblePersonName ?? "";
      if (bm.combinedField) {
        const pos  = d.responsiblePersonPosition?.trim() ?? "";
        const name = d.responsiblePersonName?.trim() ?? "";
        out[bm.combinedField] = [pos, name].filter(Boolean).join(" ");
      }
    }
  }
  return out;
}

/**
 * Subset of buildOrderDirectiveData that only returns the standard person
 * bookmark keys (layer 2). Used by the frontend to know which form fields
 * to pre-fill from a selected directive.
 */
export function getPersonFields(
  role: string,
  personName: string,
  personPosition: string
): Record<string, string> {
  const out: Record<string, string> = {};
  const bm = ROLE_BOOKMARK_MAP[role];
  if (!bm) return out;
  if (bm.positionField) out[bm.positionField] = personPosition;
  if (bm.nameField)     out[bm.nameField]     = personName;
  if (bm.combinedField) {
    out[bm.combinedField] = [personPosition, personName].filter(Boolean).join(" ");
  }
  return out;
}
