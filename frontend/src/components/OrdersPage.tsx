import { useEffect, useState } from "react";
import type { Order, OrderKind, RoleOption } from "../types";
import {
  fetchRoles,
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../api/client";

type Draft = Omit<Order, "id">;

const EMPTY: Draft = {
  kind: "приказ",
  number: "",
  date: "",
  organization: "",
  role: "",
  position: "",
  fio: "",
  validFrom: "",
  validTo: "",
};

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

function fmt(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("ru-RU");
}

export function OrdersPage() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const roleLabel = (key: string) => roles.find((r) => r.key === key)?.label ?? key;

  const load = async () => {
    setLoading(true);
    try {
      const [r, o] = await Promise.all([fetchRoles(), fetchOrders()]);
      setRoles(r);
      setOrders(o);
      setDraft((d) => (d.role ? d : { ...d, role: r[0]?.key ?? "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof Draft, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const resetForm = () => {
    setDraft({ ...EMPTY, role: roles[0]?.key ?? "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await updateOrder(editingId, draft);
      } else {
        await createOrder(draft);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEdit = (o: Order) => {
    setEditingId(o.id);
    setDraft({
      kind: o.kind,
      number: o.number,
      date: o.date,
      organization: o.organization,
      role: o.role,
      position: o.position,
      fio: o.fio,
      validFrom: o.validFrom ?? "",
      validTo: o.validTo ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись из реестра?")) return;
    setError(null);
    try {
      await deleteOrder(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {editingId ? "Редактирование документа" : "Новый приказ / распоряжение"}
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Записи автоматически подставляются в документ по дате окончания работ
          (учитывается период действия «с» — «по»).
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Тип</span>
            <select
              className={inputCls}
              value={draft.kind}
              onChange={(e) => set("kind", e.target.value as OrderKind)}
            >
              <option value="приказ">Приказ</option>
              <option value="распоряжение">Распоряжение</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Номер <span className="text-red-500">*</span></span>
            <input className={inputCls} value={draft.number} onChange={(e) => set("number", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Дата издания <span className="text-red-500">*</span></span>
            <input type="date" className={inputCls} value={draft.date} onChange={(e) => set("date", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Роль <span className="text-red-500">*</span></span>
            <select className={inputCls} value={draft.role} onChange={(e) => set("role", e.target.value)}>
              <option value="">— выберите —</option>
              {roles.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Организация</span>
            <input className={inputCls} value={draft.organization} onChange={(e) => set("organization", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">ФИО <span className="text-red-500">*</span></span>
            <input className={inputCls} value={draft.fio} onChange={(e) => set("fio", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Должность</span>
            <input className={inputCls} value={draft.position} onChange={(e) => set("position", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Действует с</span>
            <input type="date" className={inputCls} value={draft.validFrom ?? ""} onChange={(e) => set("validFrom", e.target.value)} />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Действует по</span>
            <input type="date" className={inputCls} value={draft.validTo ?? ""} onChange={(e) => set("validTo", e.target.value)} />
          </label>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all"
            >
              {editingId ? "Сохранить" : "Добавить в реестр"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Реестр приказов и распоряжений</h3>
          <span className="text-xs text-gray-400">{orders.length} записей</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-400">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">Реестр пуст. Добавьте первый документ выше.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-4 py-2 font-medium">Документ</th>
                  <th className="px-4 py-2 font-medium">Роль</th>
                  <th className="px-4 py-2 font-medium">ФИО / должность</th>
                  <th className="px-4 py-2 font-medium">Период действия</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800">
                      <div className="font-medium capitalize">{o.kind} № {o.number}</div>
                      <div className="text-xs text-gray-400">от {fmt(o.date)}{o.organization ? ` · ${o.organization}` : ""}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{roleLabel(o.role)}</td>
                    <td className="px-4 py-2.5 text-gray-800">
                      <div>{o.fio}</div>
                      {o.position && <div className="text-xs text-gray-400">{o.position}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                      {fmt(o.validFrom)} — {o.validTo ? fmt(o.validTo) : "бессрочно"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <button onClick={() => handleEdit(o)} className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3">
                        Изменить
                      </button>
                      <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
