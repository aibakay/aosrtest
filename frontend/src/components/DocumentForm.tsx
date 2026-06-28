import { useEffect, useRef, useState } from "react";
import type { TemplateDef, FieldDef, SelectedOrderDirective } from "../types";
import { FormField } from "./FormField";
import { OrderDirectivesBlock } from "./OrderDirectivesBlock";
import { generateDocument, downloadBlob } from "../api/client";

interface Props {
  template: TemplateDef;
}

const GROUP_ORDER = ["Объект", "Стороны", "Акт", "Подписанты", "Содержание", "Параметры", "Прочее"];

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

export function DocumentForm({ template }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    () => loadDraft(template.code)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [orderDirectives, setOrderDirectives] = useState<SelectedOrderDirective[]>([]);

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
      const blob = await generateDocument(template.code, values, orderDirectives);
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${template.code}_${today}.docx`);
      clearDraft(template.code);
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
        <div key={group} className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{group}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div
                key={f.name}
                className={f.type === "textarea" ? "sm:col-span-2" : ""}
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
        </div>
      ))}

      {hasWorkEndDate && (
        <OrderDirectivesBlock
          workEndDate={workEndDate}
          onChange={setOrderDirectives}
          onFieldSuggestions={handleFieldSuggestions}
        />
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 whitespace-pre-wrap">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="submit"
          disabled={loading}
          className={[
            "flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all",
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95",
          ].join(" ")}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Генерация...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Сформировать документ
            </>
          )}
        </button>

        {hasDraft && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            Очистить форму
          </button>
        )}

        <span className="text-xs text-gray-400">
          {hasDraft ? "Черновик сохранён" : "Файл .docx будет скачан автоматически"}
        </span>
      </div>
    </form>
  );
}
