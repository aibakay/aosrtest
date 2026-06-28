import { GenerateRequest, ValidationError } from "../types";
import { loadTemplates } from "./templateService";

export function validate(req: GenerateRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!req.templateCode) {
    errors.push({ field: "templateCode", message: "Не указан тип документа" });
    return errors;
  }

  const templates = loadTemplates();
  const template = templates.find(t => t.code === req.templateCode);
  if (!template) {
    errors.push({ field: "templateCode", message: `Неизвестный тип документа: ${req.templateCode}` });
    return errors;
  }

  for (const field of template.fields) {
    if (field.required) {
      const val = req.data?.[field.name];
      if (!val || String(val).trim() === "") {
        errors.push({ field: field.name, message: `Поле "${field.label}" обязательно для заполнения` });
      }
    }
  }

  return errors;
}
