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

export type OrderKind = "приказ" | "распоряжение";

export interface Order {
  id: string;
  kind: OrderKind;
  number: string;
  date: string;
  organization: string;
  role: string;
  position: string;
  fio: string;
  validFrom?: string;
  validTo?: string;
}

export interface RoleOption {
  key: string;
  label: string;
}

export interface ResolvedOrder {
  role: string;
  label: string;
  order: Order;
  fallback: boolean;
  fields: Record<string, string>;
}

export interface ResolveResponse {
  date: string;
  resolved: ResolvedOrder[];
  unmatched: string[];
  fields: Record<string, string>;
}
