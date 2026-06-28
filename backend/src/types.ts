export type FieldType = "text" | "textarea" | "date" | "number";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  group: string;
}

export interface TemplateDef {
  code: string;
  title: string;
  description: string;
  fields: FieldDef[];
}

export interface GenerateRequest {
  templateCode: string;
  data: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ── Orders / directives (приказы и распоряжения на ответственных лиц) ──────
export type OrderKind = "приказ" | "распоряжение";

export interface Order {
  id: string;
  kind: OrderKind;          // тип документа: приказ / распоряжение
  number: string;           // номер документа
  date: string;             // дата издания (ISO yyyy-mm-dd)
  organization: string;     // организация, издавшая документ
  role: string;             // ключ роли подписанта (см. ORDER_ROLES)
  position: string;         // должность ответственного лица
  fio: string;              // ФИО ответственного лица
  validFrom?: string;       // действует с (ISO); пусто = без ограничения снизу
  validTo?: string;         // действует по (ISO); пусто = бессрочно
}

// Result of resolving orders for a given completion date
export interface ResolvedOrder {
  role: string;
  label: string;
  order: Order;
  fallback: boolean;        // true если интервал не покрыл дату и взят запасной приказ
  fields: Record<string, string>; // bookmark → value, готовые к подстановке
}

export interface ResolveResponse {
  date: string;
  resolved: ResolvedOrder[];
  unmatched: string[];      // роли, для которых приказ не найден
  fields: Record<string, string>; // объединённые поля всех ролей
}
