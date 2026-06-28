import { useEffect, useMemo, useState } from "react";
import type { OrderDirective, OrderDirectiveInput } from "../types";
import { ORDER_ROLES } from "../types";
import {
  fetchOrderDirectives,
  createOrderDirective,
  updateOrderDirective,
  deleteOrderDirective,
} from "../api/orderDirectives";
import { OrderDirectiveForm } from "../components/OrderDirectiveForm";

const selectClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400";

export default function OrderDirectivesPage() {
  const [items, setItems] = useState<OrderDirective[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OrderDirective | null>(null);
  const [showForm, setShowForm] = useState(false);

  // filters & search
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fRole, setFRole] = useState("");
  const [fOrg, setFOrg] = useState("");
  const [fActive, setFActive] = useState("");
  const [fOnDate, setFOnDate] = useState("");

  const load = () => {
    setLoading(true);
    fetchOrderDirectives()
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const organizations = useMemo(
    () => [...new Set(items.map((i) => i.organization).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (fType && i.type !== fType) return false;
      if (fRole && i.role !== fRole) return false;
      if (fOrg && i.organization !== fOrg) return false;
      if (fActive === "active" && !i.isActive) return false;
      if (fActive === "inactive" && i.isActive) return false;
      if (fOnDate) {
        const inForce =
          i.isActive && i.validFrom <= fOnDate && (!i.validTo || i.validTo >= fOnDate);
        if (!inForce) return false;
      }
      if (q) {
        const hay = [i.number, i.responsiblePersonName, i.responsiblePersonPosition, i.organization]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, fType, fRole, fOrg, fActive, fOnDate]);

  const handleSave = async (input: OrderDirectiveInput) => {
    if (editing) {
      await updateOrderDirective(editing.id, input);
    } else {
      await createOrderDirective(input);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDeactivate = async (item: OrderDirective) => {
    if (!confirm(`Деактивировать «${item.type === "directive" ? "распоряжение" : "приказ"} № ${item.number}»?`)) return;
    try {
      await deleteOrderDirective(item.id);
      load();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Приказы и распоряжения</h2>
          <p className="mt-1 text-sm text-gray-500">
            Справочник приказов и распоряжений на ответственных лиц
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className={selectClass + " min-w-[220px] flex-1"}
          placeholder="Поиск: номер, ФИО, должность, организация"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={selectClass} value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">Все типы</option>
          <option value="order">Приказ</option>
          <option value="directive">Распоряжение</option>
        </select>
        <select className={selectClass} value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="">Все роли</option>
          {ORDER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={selectClass} value={fOrg} onChange={(e) => setFOrg(e.target.value)}>
          <option value="">Все организации</option>
          {organizations.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className={selectClass} value={fActive} onChange={(e) => setFActive(e.target.value)}>
          <option value="">Активные и нет</option>
          <option value="active">Только активные</option>
          <option value="inactive">Только неактивные</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-gray-600">
          Действует на:
          <input type="date" className={selectClass} value={fOnDate} onChange={(e) => setFOnDate(e.target.value)} />
        </label>
        {(search || fType || fRole || fOrg || fActive || fOnDate) && (
          <button
            onClick={() => { setSearch(""); setFType(""); setFRole(""); setFOrg(""); setFActive(""); setFOnDate(""); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Номер / дата</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Ответственное лицо</th>
              <th className="px-4 py-3">Организация</th>
              <th className="px-4 py-3">Действие</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Записей не найдено</td></tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id} className={i.isActive ? "" : "bg-gray-50/60 text-gray-400"}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {i.type === "directive" ? "Распоряжение" : "Приказ"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">№ {i.number}</span>
                    <div className="text-xs text-gray-400">{i.date}</div>
                  </td>
                  <td className="px-4 py-3">{i.role}</td>
                  <td className="px-4 py-3">
                    {i.responsiblePersonName || "—"}
                    {i.responsiblePersonPosition && (
                      <div className="text-xs text-gray-400">{i.responsiblePersonPosition}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{i.organization || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {i.validFrom} — {i.validTo || "бессрочно"}
                  </td>
                  <td className="px-4 py-3">
                    {i.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">активна</span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">неактивна</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => { setEditing(i); setShowForm(true); }} className="text-sm text-blue-600 hover:underline">
                      Изменить
                    </button>
                    {i.isActive && (
                      <button onClick={() => handleDeactivate(i)} className="ml-3 text-sm text-red-600 hover:underline">
                        Деактивировать
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Показано {filtered.length} из {items.length}
      </p>

      {showForm && (
        <OrderDirectiveForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
