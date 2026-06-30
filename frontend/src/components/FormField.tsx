import type { FieldDef } from "../types";
import { AttachmentsListField } from "./AttachmentsListField";
import { Input, Textarea } from "./ui/Input";
import { Badge } from "./ui/Badge";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  /** True when this field's value was set automatically from an order/directive. */
  autoFilled?: boolean;
}

export function FormField({ field, value, onChange, error, autoFilled }: Props) {
  if (field.type === "attachments") {
    return (
      <AttachmentsListField
        label={field.label}
        required={field.required}
        value={value}
        onChange={(v) => onChange(field.name, v)}
        error={error}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
        {field.label}
        {field.required && <span className="text-danger-500">*</span>}
        {autoFilled && !error && (
          <span title="Подставлено автоматически из справочника приказов">
            <Badge tone="brand">авто</Badge>
          </span>
        )}
      </label>

      {field.type === "textarea" ? (
        <Textarea
          rows={3}
          error={!!error}
          autoFilled={autoFilled}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.label}
        />
      ) : (
        <Input
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          error={!!error}
          autoFilled={autoFilled}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.type === "date" ? "" : field.label}
        />
      )}

      {error && <p className="text-xs text-danger-700">{error}</p>}
    </div>
  );
}
