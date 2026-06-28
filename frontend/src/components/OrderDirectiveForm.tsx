import { useState } from "react";
import type { OrderDirective, OrderDirectiveInput } from "../types";
import { ORDER_ROLES } from "../types";

interface Props {
  initial?: OrderDirective | null;
  onCancel: () => void;
  onSave: (input: OrderDirectiveInput) => Promise<void>;
}

function emptyInput(): OrderDirectiveInput {
  return {
    type: "order",
    number: "",
    date: "",
    title: "",
    responsiblePersonName: "",
    responsiblePersonPosition: "",
    role: ORDER_ROLES[0],
    validFrom: "",
    validTo: null,
    organization: "",
    basisText: "",
    comment: "",
    isActive: true,
  };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

export function OrderDirectiveForm({ initial, onCancel, onSave }: Props) {
  const [v, setV] = useState<OrderDirectiveInput>(
    initial ? { ...initial } : emptyInput()
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<OrderDirectiveInput>) => setV((p) => ({ ...p, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!v.number.trim() || !v.date || !v.role || !v.validFrom) {
      setError("Заполните: номер, дату документа, роль и дату начала действия.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...v, validTo: v.validTo || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {initial ? "Редактировать запись" : "Добавить приказ / распоряжение"}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Тип документа">
            <select className={inputClass} value={v.type} onChange={(e) => set({ type: e.target.value as OrderDirective["type"] })}>
              <option value="order">Приказ</option>
              <option value="directive">Распоряжение</option>
            </select>
          </Field>
          <Field label="Роль в ИД">
            <select className={inputClass} value={v.role} onChange={(e) => set({ role: e.target.value })}>
              {ORDER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Номер" required>
            <input className={inputClass} value={v.number} onChange={(e) => set({ number: e.target.value })} />
          </Field>
          <Field label="Дата документа" required>
            <input type="date" className={inputClass} value={v.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Краткое наименование" full>
            <input className={inputClass} value={v.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="ФИО ответственного лица">
            <input className={inputClass} value={v.responsiblePersonName} onChange={(e) => set({ responsiblePersonName: e.target.value })} />
          </Field>
          <Field label="Должность">
            <input className={inputClass} value={v.responsiblePersonPosition} onChange={(e) => set({ responsiblePersonPosition: e.target.value })} />
          </Field>
          <Field label="Организация" full>
            <input className={inputClass} value={v.organization} onChange={(e) => set({ organization: e.target.value })} />
          </Field>
          <Field label="Действует с" required>
            <input type="date" className={inputClass} value={v.validFrom} onChange={(e) => set({ validFrom: e.target.value })} />
          </Field>
          <Field label="Действует по (пусто = бессрочно)">
            <input type="date" className={inputClass} value={v.validTo ?? ""} onChange={(e) => set({ validTo: e.target.value || null })} />
          </Field>
          <Field label="Текст основания для ИД" full>
            <textarea rows={3} className={inputClass + " resize-y"} value={v.basisText} onChange={(e) => set({ basisText: e.target.value })} />
          </Field>
          <Field label="Комментарий" full>
            <textarea rows={2} className={inputClass + " resize-y"} value={v.comment} onChange={(e) => set({ comment: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={v.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              Активна
            </label>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
