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
