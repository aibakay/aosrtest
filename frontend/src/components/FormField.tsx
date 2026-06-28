import type { FieldDef } from "../types";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  /** True when this field's value was set automatically from an order/directive. */
  autoFilled?: boolean;
}

export function FormField({ field, value, onChange, error, autoFilled }: Props) {
  const inputClass = [
    "w-full rounded-lg border px-3 py-2 text-sm text-gray-800",
    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent",
    error
      ? "border-red-400 bg-red-50"
      : autoFilled
        ? "border-blue-300 bg-blue-50"
        : "border-gray-300 bg-white",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
        {autoFilled && !error && (
          <span
            className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-normal text-blue-600"
            title="Подставлено автоматически из справочника приказов"
          >
            авто
          </span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          rows={3}
          className={inputClass + " resize-y"}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.label}
        />
      ) : (
        <input
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.type === "date" ? "" : field.label}
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
