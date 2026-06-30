/**
 * Common "Объект"/"Стороны" bookmarks shared by every act template
 * (see backend/src/config/templates.ts FIELD_META). Stored once per
 * registry and auto-filled into every act added to it.
 */
export interface ObjectFieldDef {
  name: string;
  label: string;
  type: "text" | "textarea";
}

export const OBJECT_FIELD_DEFS: ObjectFieldDef[] = [
  { name: "Наименование_объекта", label: "Наименование объекта", type: "textarea" },
  { name: "город", label: "Город", type: "text" },
  { name: "реквизиты_заказчика", label: "Заказчик (реквизиты)", type: "textarea" },
  { name: "реквизиты_генподрядчика", label: "Генподрядчик (реквизиты)", type: "textarea" },
  { name: "реквизиты_проектировщика", label: "Проектировщик (реквизиты)", type: "textarea" },
  { name: "реквизиты_подрядчика", label: "Подрядчик (реквизиты)", type: "textarea" },
  { name: "н_исполнителя", label: "Наименование исполнителя", type: "text" },
];
