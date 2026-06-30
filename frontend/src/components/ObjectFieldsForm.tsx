import { OBJECT_FIELD_DEFS } from "../config/objectFields";
import { Input, Textarea } from "./ui/Input";

interface Props {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

/** Editor for the reusable per-object requisites (Объект/Стороны bookmarks). */
export function ObjectFieldsForm({ value, onChange }: Props) {
  const set = (name: string, v: string) => onChange({ ...value, [name]: v });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {OBJECT_FIELD_DEFS.map((f) => (
        <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
          <label className="mb-1 block text-xs font-medium text-ink-600">{f.label}</label>
          {f.type === "textarea" ? (
            <Textarea
              rows={2}
              value={value[f.name] ?? ""}
              onChange={(e) => set(f.name, e.target.value)}
            />
          ) : (
            <Input value={value[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
          )}
        </div>
      ))}
    </div>
  );
}
