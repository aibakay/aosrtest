import { useEffect, useState } from "react";
import type { Registry, RegistryInput } from "../types";
import { fetchRegistries, createRegistry, updateRegistry, deleteRegistry } from "../api/registries";
import { navigate } from "../router";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { ListItemCard } from "../components/ui/ListItemCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { ObjectFieldsForm } from "../components/ObjectFieldsForm";

const emptyForm: RegistryInput = { name: "", objectName: "", objectFields: {} };

const AddIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const RegistriesEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function RegistriesPage() {
  const toast = useToast();
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RegistryInput>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Registry | null>(null);

  const formOpen = creating || editingId !== null;

  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEdit = (reg: Registry) => {
    setCreating(false);
    setEditingId(reg.id);
    setForm({ name: reg.name, objectName: reg.objectName, objectFields: reg.objectFields ?? {} });
    setFormError(null);
  };

  const load = () => {
    setLoading(true);
    fetchRegistries()
      .then(setRegistries)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Название реестра обязательно"); return; }
    setFormError(null);
    setSaving(true);
    try {
      if (editingId) {
        const reg = await updateRegistry(editingId, form);
        setRegistries((prev) => prev.map((r) => (r.id === reg.id ? reg : r)));
        toast.show("Реестр обновлён", "success");
      } else {
        const reg = await createRegistry(form);
        setRegistries((prev) => [reg, ...prev]);
        toast.show("Реестр создан", "success");
      }
      closeForm();
    } catch (e) {
      setFormError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget.id;
    setDeletingId(id);
    try {
      await deleteRegistry(id);
      setRegistries((prev) => prev.filter((r) => r.id !== id));
      toast.show("Реестр удалён", "success");
    } catch (e) {
      toast.show(String(e), "error");
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Реестры актов</h2>
          <p className="mt-0.5 text-sm text-ink-500">Наборы актов (АОСР / АООК / …) по объекту</p>
        </div>
        <Button icon={AddIcon} onClick={() => { setCreating(true); setEditingId(null); setForm(emptyForm); setFormError(null); }}>
          Новый реестр
        </Button>
      </div>

      {formOpen && (
        <Card highlight>
          <h3 className="mb-4 text-sm font-semibold text-ink-700">
            {editingId ? "Реквизиты объекта" : "Новый реестр"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">
                Название реестра <span className="text-danger-500">*</span>
              </label>
              <Input
                placeholder="Например: Реестр актов по корпусу А"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-600">Объект (для списка реестров)</label>
              <Input
                placeholder="Наименование объекта строительства"
                value={form.objectName}
                onChange={(e) => setForm((f) => ({ ...f, objectName: e.target.value }))}
              />
            </div>

            <div className="border-t border-ink-100 pt-3">
              <p className="mb-3 text-xs text-ink-500">
                Реквизиты объекта и сторон — заполните один раз, и они автоматически
                подставятся в каждый акт, добавленный в этот реестр.
              </p>
              <ObjectFieldsForm
                value={form.objectFields ?? {}}
                onChange={(next) => setForm((f) => ({ ...f, objectFields: next }))}
              />
            </div>

            {formError && <p className="text-sm text-danger-700">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={saving}>
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-ink-400">
          <Spinner /> Загрузка реестров...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
      )}

      {!loading && !error && registries.length === 0 && !creating && (
        <EmptyState icon={RegistriesEmptyIcon} message="Реестров пока нет — создайте первый" />
      )}

      <div className="space-y-3">
        {registries.map((reg) => (
          <ListItemCard
            key={reg.id}
            onClick={() => navigate(`/registries/${reg.id}`)}
            title={reg.name}
            subtitle={reg.objectName || undefined}
            meta={`${reg.items.length} ${actWord(reg.items.length)} · создан ${formatDate(reg.createdAt)}`}
            actions={
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/registries/${reg.id}`)}>
                  Открыть
                </Button>
                <Button variant="ghost" size="sm" onClick={() => startEdit(reg)}>
                  Реквизиты
                </Button>
                <Button
                  variant="danger-ghost"
                  size="sm"
                  loading={deletingId === reg.id}
                  onClick={() => setConfirmTarget(reg)}
                >
                  Удалить
                </Button>
              </>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Удалить реестр?"
        message={`Реестр «${confirmTarget?.name}» и все его акты будут удалены без возможности восстановления.`}
        confirmLabel="Удалить"
        danger
        loading={deletingId !== null}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function actWord(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return "актов";
  const r = n % 10;
  if (r === 1) return "акт";
  if (r >= 2 && r <= 4) return "акта";
  return "актов";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}
