import { useEffect, useState } from "react";
import type {
  ActiveDirectivesResult,
  OrderDirective,
  SelectedOrderDirective,
} from "../types";
import { fetchActiveOnDate } from "../api/orderDirectives";
import { buildFieldSuggestions } from "../config/orderFieldMapping";
import { Link } from "../router";
import { Card } from "./ui/Card";
import { Select } from "./ui/Input";
import { Spinner } from "./ui/Spinner";

interface Props {
  /** ISO YYYY-MM-DD — дата окончания работ */
  workEndDate: string;
  /** Fires when the selection of directives changes. */
  onChange: (selected: SelectedOrderDirective[]) => void;
  /**
   * Fires whenever suggestions for form field pre-fill change.
   * Pass `null` to signal "clear auto-filled values" (date was removed).
   */
  onFieldSuggestions: (fields: Record<string, string> | null) => void;
}

function describe(d: OrderDirective): string {
  const t = d.type === "directive" ? "Распоряжение" : "Приказ";
  const who = d.responsiblePersonName ? ` — ${d.responsiblePersonName}` : "";
  return `${t} № ${d.number} от ${d.date}${who}`;
}

export function OrderDirectivesBlock({ workEndDate, onChange, onFieldSuggestions }: Props) {
  const [result, setResult] = useState<ActiveDirectivesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!workEndDate) {
      setResult(null);
      setChosen({});
      onChange([]);
      onFieldSuggestions(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchActiveOnDate(workEndDate)
      .then((res) => {
        setResult(res);
        const init: Record<string, string> = {};
        for (const g of res.groups) if (g.selected) init[g.role] = g.selected.id;
        setChosen(init);
      })
      .catch((e) => { setError(String(e)); setResult(null); onFieldSuggestions(null); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workEndDate]);

  // Recompute selection + field suggestions whenever chosen map or result change.
  useEffect(() => {
    if (!result) { onChange([]); return; }

    const selected: SelectedOrderDirective[] = [];
    const suggestionInput: { role: string; personName: string; personPosition: string }[] = [];

    for (const g of result.groups) {
      const id = chosen[g.role];
      const dir = g.candidates.find((c) => c.id === id);
      if (dir) {
        selected.push({ role: g.role, directive: dir });
        suggestionInput.push({
          role: g.role,
          personName: dir.responsiblePersonName,
          personPosition: dir.responsiblePersonPosition,
        });
      }
    }

    onChange(selected);
    onFieldSuggestions(buildFieldSuggestions(suggestionInput));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, result]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Приказы и распоряжения
        </h3>
        <Link to="/order-directives" className="text-xs text-brand-600 hover:underline">
          Управлять справочником →
        </Link>
      </div>

      {!workEndDate && (
        <p className="text-sm text-ink-400">
          Укажите дату окончания работ — действующие приказы подтянутся автоматически.
        </p>
      )}

      {loading && (
        <p className="flex items-center gap-2 text-sm text-ink-400">
          <Spinner /> Подбор действующих документов…
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-3 text-sm text-danger-700">{error}</div>
      )}

      {result && !loading && (
        <>
          {result.warnings.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {result.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
            </div>
          )}

          {result.groups.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ⚠ На {result.date} действующих приказов и распоряжений не найдено.
              Генерация продолжится без них.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {result.groups.map((g) => (
                  <div key={g.role} className="grid grid-cols-1 gap-1 sm:grid-cols-[260px_1fr] sm:items-center">
                    <div className="text-sm font-medium text-ink-700">
                      {g.role}
                      {g.hasMultiple && <span className="ml-1 text-amber-600" title="Найдено несколько">⚠</span>}
                    </div>
                    <Select
                      value={chosen[g.role] ?? ""}
                      onChange={(e) => setChosen((p) => ({ ...p, [g.role]: e.target.value }))}
                    >
                      <option value="">— не подставлять —</option>
                      {g.candidates.map((c) => (
                        <option key={c.id} value={c.id}>{describe(c)}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-400">
                ФИО и должности подписантов подставлены в форму автоматически — отредактируйте при необходимости.
              </p>
            </>
          )}
        </>
      )}
    </Card>
  );
}
