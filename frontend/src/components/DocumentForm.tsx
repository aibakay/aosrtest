import { useEffect, useRef, useState } from "react";
import type { TemplateDef, FieldDef, SelectedOrderDirective } from "../types";
import { FormField } from "./FormField";
import { OrderDirectivesBlock } from "./OrderDirectivesBlock";
import { generateDocument, downloadBlob } from "../api/client";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

interface Props {
  template: TemplateDef;
  /** When provided, renders a "save" button instead of "generate". */
  onSave?: (data: Record<string, string>, orderDirectives: SelectedOrderDirective[]) => Promise<void> | void;
  /** Pre-populate form fields (used when editing an existing act). */
  initialValues?: Record<string, string>;
  initialOrderDirectives?: SelectedOrderDirective[];
}

const GROUP_ORDER = ["Объект", "Стороны", "Акт", "Подписанты", "Содержание", "Параметры", "Прочее"];

const SaveIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
  </svg>
);
const GenerateIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

function draftKey(code: string) {
  return `draft:${code}`;
}

function loadDraft(code: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(draftKey(code));
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  return {};
}

function saveDraft(code: string, values: Record<string, string>) {
  try {
    localStorage.setItem(draftKey(code), JSON.stringify(values));
  } catch { /* ignore — quota exceeded etc. */ }
}

function clearDraft(code: string) {
  try { localStorage.removeItem(draftKey(code)); } catch { /* ignore */ }
}

export function DocumentForm({ template, onSave, initialValues, initialOrderDirectives }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    () => initialValues ?? loadDraft(template.code)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [bundleNotice, setBundleNotice] = useState<string | null>(null);
  const [orderDirectives, setOrderDirectives] = useState<SelectedOrderDirective[]>(
    initialOrderDirectives ?? []
  );

  // Tracks which fields were last set by order auto-suggestion (not by the user).
  // Stored in a ref so mutation doesn't trigger re-render.
  const autoFilledFields = useRef<Set<string>>(new Set());

  // Persist draft to localStorage on every values change.
  useEffect(() => {
    saveDraft(template.code, values);
  }, [template.code, values]);

  const hasWorkEndDate = template.fields.some((f) => f.name === "Дата_оконч_picker");
  const workEndDate = values["Дата_оконч_picker"] ?? "";

  const handleChange = (name: string, value: string) => {
    // When user types, they own this field — remove from auto-fill tracking.
    autoFilledFields.current.delete(name);
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  /**
   * Called by OrderDirectivesBlock when the selection changes.
   * `null` means "date cleared / no orders" — wipe previously auto-filled values.
   * A map means "these are the suggested values for person fields".
   * Only fields the user hasn't manually edited are updated.
   */
  const handleFieldSuggestions = (suggestions: Record<string, string> | null) => {
    if (suggestions === null) {
      // Clear values that were auto-filled and haven't been edited since.
      if (autoFilledFields.current.size === 0) return;
      setValues((prev) => {
        const next = { ...prev };
        for (const f of autoFilledFields.current) {
          delete next[f];
        }
        return next;
      });
      autoFilledFields.current.clear();
      return;
    }

    // Apply suggestions only to:
    //   - fields currently tracked as auto-filled (user hasn't taken ownership yet)
    //   - fields that are completely empty
    // Fields that the user has manually edited are not in autoFilledFields and are
    // non-empty, so they are left untouched.
    setValues((prev) => {
      const next = { ...prev };
      for (const [field, value] of Object.entries(suggestions)) {
        const wasAutoFilled = autoFilledFields.current.has(field);
        const isEmpty = !prev[field]?.trim();
        if (wasAutoFilled || isEmpty) {
          next[field] = value;
          autoFilledFields.current.add(field);
        }
      }
      return next;
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const f of template.fields) {
      if (f.required && !values[f.name]?.trim()) {
        errors[f.name] = `Обязательное поле`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      if (onSave) {
        await onSave(values, orderDirectives);
      } else {
        const result = await generateDocument(template.code, values, orderDirectives);
        downloadBlob(result.blob, result.fileName);
        clearDraft(template.code);
        if (result.isBundle) {
          setBundleNotice(
            "Приложений больше 5 — скачан ZIP-архив с актом и реестром документов, подтверждающих качество."
          );
          setTimeout(() => setBundleNotice(null), 8000);
        }
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setValues({});
    setFieldErrors({});
    setServerError(null);
    autoFilledFields.current.clear();
    clearDraft(template.code);
  };

  // Group fields by section.
  const groups = new Map<string, FieldDef[]>();
  for (const f of template.fields) {
    const g = f.group || "Прочее";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(f);
  }

  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    const ia = GROUP_ORDER.indexOf(a);
    const ib = GROUP_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return 0;
  });

  const hasDraft = Object.values(values).some((v) => v?.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sortedGroups.map(([group, fields]) => (
        <Card key={group}>
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-4">{group}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div
                key={f.name}
                className={f.type === "textarea" || f.type === "attachments" ? "sm:col-span-2" : ""}
              >
                <FormField
                  field={f}
                  value={values[f.name] ?? ""}
                  onChange={handleChange}
                  error={fieldErrors[f.name]}
                  autoFilled={autoFilledFields.current.has(f.name)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {hasWorkEndDate && (
        <OrderDirectivesBlock
          workEndDate={workEndDate}
          onChange={setOrderDirectives}
          onFieldSuggestions={handleFieldSuggestions}
        />
      )}

      {serverError && (
        <div className="rounded-lg bg-danger-50 border border-danger-500/30 p-4 text-sm text-danger-700 whitespace-pre-wrap">
          {serverError}
        </div>
      )}

      {bundleNotice && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 p-4 text-sm text-brand-800">
          📦 {bundleNotice}
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <Button type="submit" size="md" loading={loading} icon={onSave ? SaveIcon : GenerateIcon}>
          {loading ? (onSave ? "Сохранение..." : "Генерация...") : onSave ? "Сохранить акт" : "Сформировать документ"}
        </Button>

        {hasDraft && !loading && (
          <Button type="button" variant="ghost" onClick={handleClear}>
            Очистить форму
          </Button>
        )}

        <span className="text-xs text-ink-400">
          {hasDraft ? "Черновик сохранён" : "Файл .docx будет скачан автоматически"}
        </span>
      </div>
    </form>
  );
}
