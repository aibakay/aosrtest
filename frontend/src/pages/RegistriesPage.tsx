import { useEffect, useState } from "react";
import type { Registry, RegistryInput } from "../types";
import { fetchRegistries, createRegistry, deleteRegistry } from "../api/registries";
import { navigate } from "../router";

export default function RegistriesPage() {
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<RegistryInput>({ name: "", objectName: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchRegistries()
      .then(setRegistries)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Название реестра обязательно"); return; }
    setFormError(null);
    setSaving(true);
    try {
      const reg = await createRegistry(form);
      setRegistries((prev) => [reg, ...prev]);
      setCreating(false);
      setForm({ name: "", objectName: "" });
    } catch (e) {
      setFormError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить реестр вместе со всеми актами?")) return;
    setDeletingId(id);
    try {
      await deleteRegistry(id);
      setRegistries((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(String(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Реестры актов</h2>
          <p className="text-sm text-gray-500 mt-0.5">Наборы актов (АОСР / АООК / …) по объекту</p>
        </div>
        <button
          onClick={() => { setCreating(true); setFormError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Новый реестр
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Новый реестр</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Название реестра <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Реестр актов по корпусу А"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Объект</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Наименование объекта строительства"
                value={form.objectName}
                onChange={(e) => setForm((f) => ({ ...f, objectName: e.target.value }))}
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Создание..." : "Создать"}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setFormError(null); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
          Загрузка реестров...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && registries.length === 0 && !creating && (
        <div className="text-center py-20 text-gray-400">
          <svg className="h-12 w-12 mx-auto mb-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Реестров пока нет — создайте первый</p>
        </div>
      )}

      <div className="space-y-3">
        {registries.map((reg) => (
          <div
            key={reg.id}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => navigate(`/registries/${reg.id}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{reg.name}</p>
              {reg.objectName && (
                <p className="text-sm text-gray-500 truncate mt-0.5">{reg.objectName}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {reg.items.length} {actWord(reg.items.length)} · создан {formatDate(reg.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/registries/${reg.id}`); }}
                className="px-3 py-1.5 rounded-lg text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
              >
                Открыть
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(reg.id); }}
                disabled={deletingId === reg.id}
                className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
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
