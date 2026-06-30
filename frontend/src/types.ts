export type FieldType = "text" | "textarea" | "date" | "number" | "attachments";

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

// ── Orders & directives ──────────────────────────────────────────────────
export type OrderDirectiveType = "order" | "directive";

export const ORDER_ROLES = [
  "заказчик",
  "строительный контроль",
  "подрядчик",
  "генподрядчик",
  "проектировщик",
  "лицо, выполнившее работы",
  "ответственное лицо за производство работ",
] as const;

export interface OrderDirective {
  id: string;
  type: OrderDirectiveType;
  number: string;
  date: string;
  title: string;
  responsiblePersonName: string;
  responsiblePersonPosition: string;
  role: string;
  validFrom: string;
  validTo: string | null;
  organization: string;
  basisText: string;
  comment: string;
  isActive: boolean;
}

export type OrderDirectiveInput = Omit<OrderDirective, "id">;

export interface ActiveRoleGroup {
  role: string;
  candidates: OrderDirective[];
  selected: OrderDirective | null;
  hasMultiple: boolean;
}

export interface ActiveDirectivesResult {
  date: string;
  groups: ActiveRoleGroup[];
  warnings: string[];
}

export interface SelectedOrderDirective {
  role: string;
  directive: OrderDirective;
}

// ── Registry (реестр актов) ───────────────────────────────────────────────

export interface ActEntry {
  id: string;
  templateCode: string;
  data: Record<string, string>;
  orderDirectives?: SelectedOrderDirective[];
  createdAt: string;
}

export interface Registry {
  id: string;
  name: string;
  objectName: string;
  createdAt: string;
  items: ActEntry[];
}

export type RegistryInput = Omit<Registry, "id" | "createdAt" | "items">;
export type ActEntryInput = Omit<ActEntry, "id" | "createdAt">;
