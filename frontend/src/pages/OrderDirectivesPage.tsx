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
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

export default function OrderDirectivesPage() {
  const toast = useToast();
  const [items, setItems] = useState<OrderDirective[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OrderDirective | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<OrderDirective | null>(null);
  const [deactivating, setDeactivating] = useState(false);

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
    toast.show(editing ? "Запись обновлена" : "Запись добавлена", "success");
  };

  const handleDeactivate = async () => {
    if (!confirmTarget) return;
    setDeactivating(true);
    try {
      await deleteOrderDirective(confirmTarget.id);
      load();
      toast.show("Деактивировано", "success");
    } catch (e) {
      toast.show(String(e), "error");
    } finally {
      setDeactivating(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Приказы и распоряжения</h2>
          <p className="mt-1 text-sm text-ink-500">
            Справочник приказов и распоряжений на ответственных лиц
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Добавить</Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          className="min-w-[220px] flex-1"
          placeholder="Поиск: номер, ФИО, должность, организация"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="!w-auto" value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">Все типы</option>
          <option value="order">Приказ</option>
          <option value="directive">Распоряжение</option>
        </Select>
        <Select className="!w-auto" value={fRole} onChange={(e) => setFRole(e.target.value)}>
          <option value="">Все роли</option>
          {ORDER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select className="!w-auto" value={fOrg} onChange={(e) => setFOrg(e.target.value)}>
          <option value="">Все организации</option>
          {organizations.map((o) => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select className="!w-auto" value={fActive} onChange={(e) => setFActive(e.target.value)}>
          <option value="">Активные и нет</option>
          <option value="active">Только активные</option>
          <option value="inactive">Только неактивные</option>
        </Select>
        <label className="flex items-center gap-1 text-sm text-ink-600">
          Действует на:
          <Input type="date" className="!w-auto" value={fOnDate} onChange={(e) => setFOnDate(e.target.value)} />
        </label>
        {(search || fType || fRole || fOrg || fActive || fOnDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setFType(""); setFRole(""); setFOrg(""); setFActive(""); setFOnDate(""); }}
          >
            Сбросить
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="min-w-full divide-y divide-ink-200 text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
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
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-400">
                  <span className="inline-flex items-center gap-2"><Spinner /> Загрузка...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-400">Записей не найдено</td></tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id} className={i.isActive ? "" : "bg-ink-50/60 text-ink-400"}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {i.type === "directive" ? "Распоряжение" : "Приказ"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">№ {i.number}</span>
                    <div className="text-xs text-ink-400">{i.date}</div>
                  </td>
                  <td className="px-4 py-3">{i.role}</td>
                  <td className="px-4 py-3">
                    {i.responsiblePersonName || "—"}
                    {i.responsiblePersonPosition && (
                      <div className="text-xs text-ink-400">{i.responsiblePersonPosition}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{i.organization || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {i.validFrom} — {i.validTo || "бессрочно"}
                  </td>
                  <td className="px-4 py-3">
                    {i.isActive ? <Badge tone="success">активна</Badge> : <Badge tone="neutral">неактивна</Badge>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(i); setShowForm(true); }}>
                      Изменить
                    </Button>
                    {i.isActive && (
                      <Button variant="danger-ghost" size="sm" className="ml-1" onClick={() => setConfirmTarget(i)}>
                        Деактивировать
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-400">
        Показано {filtered.length} из {items.length}
      </p>

      {showForm && (
        <OrderDirectiveForm
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Деактивировать запись?"
        message={`«${confirmTarget?.type === "directive" ? "Распоряжение" : "Приказ"} № ${confirmTarget?.number}» перестанет учитываться при автоподборе ответственных лиц.`}
        confirmLabel="Деактивировать"
        danger
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
