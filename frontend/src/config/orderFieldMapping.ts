/**
 * Maps an order/directive role to the form field names that should be pre-filled
 * with the responsible person's data. Mirrors backend/src/config/orderDirectiveMapping.ts
 * (ROLE_BOOKMARK_MAP) so the frontend can suggest values before the user submits.
 *
 * Keys here are the same strings used as Word bookmark names — which are also
 * the field names in the dynamic form built from template bookmarks.
 */
interface PersonFields {
  positionField?: string;
  nameField?: string;
  combinedField?: string;
}

export const ROLE_FIELD_MAP: Record<string, PersonFields> = {
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
 * Given a list of selected directives, returns a flat map of field → value
 * with the person data that should be suggested into the form.
 * Later roles in the array overwrite earlier ones for the same field.
 */
export function buildFieldSuggestions(
  selected: { role: string; personName: string; personPosition: string }[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { role, personName, personPosition } of selected) {
    const map = ROLE_FIELD_MAP[role];
    if (!map) continue;
    if (map.positionField) out[map.positionField] = personPosition;
    if (map.nameField)     out[map.nameField]     = personName;
    if (map.combinedField) {
      out[map.combinedField] = [personPosition, personName].filter(Boolean).join(" ");
    }
  }
  return out;
}
