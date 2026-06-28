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
  orderDirectives?: SelectedOrderDirective[];
}

// ── Orders & directives (приказы и распоряжения) ─────────────────────────
export type OrderDirectiveType = "order" | "directive";

// Role in the executive documentation. Kept as a string (not a closed union)
// so new roles can be added without breaking storage, but these are the
// canonical values used by the UI and the Word mapping layer.
export type OrderRole =
  | "заказчик"
  | "строительный контроль"
  | "подрядчик"
  | "генподрядчик"
  | "проектировщик"
  | "лицо, выполнившее работы"
  | "ответственное лицо за производство работ";

export interface OrderDirective {
  id: string;
  type: OrderDirectiveType;
  number: string;
  date: string;                 // ISO YYYY-MM-DD — дата приказа/распоряжения
  title: string;
  responsiblePersonName: string;
  responsiblePersonPosition: string;
  role: string;
  validFrom: string;            // ISO YYYY-MM-DD
  validTo: string | null;       // ISO YYYY-MM-DD or null (бессрочно)
  organization: string;
  basisText: string;            // текст, попадающий в ИД
  comment: string;
  isActive: boolean;
}

// Payload accepted on create/update (id is generated server-side)
export type OrderDirectiveInput = Omit<OrderDirective, "id">;

// A directive chosen for a given role when generating a document
export interface SelectedOrderDirective {
  role: string;
  directive: OrderDirective;
}

// One role group returned by the "active on date" endpoint
export interface ActiveRoleGroup {
  role: string;
  candidates: OrderDirective[];
  selected: OrderDirective | null; // most recent by validFrom
  hasMultiple: boolean;
}

export interface ActiveDirectivesResult {
  date: string;
  groups: ActiveRoleGroup[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}
