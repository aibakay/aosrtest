import { useState } from "react";
import type { OrderDirective, OrderDirectiveInput } from "../types";
import { ORDER_ROLES } from "../types";
import { Input, Select, Textarea } from "./ui/Input";
import { Button } from "./ui/Button";

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-ink-900">
            {initial ? "Редактировать запись" : "Добавить приказ / распоряжение"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-ink-400 hover:text-ink-600"
            title="Закрыть"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Тип документа">
            <Select value={v.type} onChange={(e) => set({ type: e.target.value as OrderDirective["type"] })}>
              <option value="order">Приказ</option>
              <option value="directive">Распоряжение</option>
            </Select>
          </Field>
          <Field label="Роль в ИД">
            <Select value={v.role} onChange={(e) => set({ role: e.target.value })}>
              {ORDER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Номер" required>
            <Input value={v.number} onChange={(e) => set({ number: e.target.value })} />
          </Field>
          <Field label="Дата документа" required>
            <Input type="date" value={v.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Краткое наименование" full>
            <Input value={v.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="ФИО ответственного лица">
            <Input value={v.responsiblePersonName} onChange={(e) => set({ responsiblePersonName: e.target.value })} />
          </Field>
          <Field label="Должность">
            <Input value={v.responsiblePersonPosition} onChange={(e) => set({ responsiblePersonPosition: e.target.value })} />
          </Field>
          <Field label="Организация" full>
            <Input value={v.organization} onChange={(e) => set({ organization: e.target.value })} />
          </Field>
          <Field label="Действует с" required>
            <Input type="date" value={v.validFrom} onChange={(e) => set({ validFrom: e.target.value })} />
          </Field>
          <Field label="Действует по (пусто = бессрочно)">
            <Input type="date" value={v.validTo ?? ""} onChange={(e) => set({ validTo: e.target.value || null })} />
          </Field>
          <Field label="Текст основания для ИД" full>
            <Textarea rows={3} value={v.basisText} onChange={(e) => set({ basisText: e.target.value })} />
          </Field>
          <Field label="Комментарий" full>
            <Textarea rows={2} value={v.comment} onChange={(e) => set({ comment: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={v.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              Активна
            </label>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-4 whitespace-pre-wrap rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-ink-200 px-6 py-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
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
      <label className="text-sm font-medium text-ink-700">
        {label}
        {required && <span className="ml-1 text-danger-500">*</span>}
      </label>
      {children}
    </div>
  );
}
