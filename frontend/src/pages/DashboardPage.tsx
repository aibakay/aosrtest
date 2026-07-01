import { useEffect, useState } from "react";
import type { Registry, OrderDirective, TemplateDef, ActEntry } from "../types";
import { fetchTemplates } from "../api/client";
import { fetchRegistries } from "../api/registries";
import { fetchOrderDirectives } from "../api/orderDirectives";
import { navigate } from "../router";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { DocIcon, BookIcon, ListIcon } from "../components/icons";

interface RecentAct {
  act: ActEntry;
  registry: Registry;
  template?: TemplateDef;
}

const TemplatesIcon = <DocIcon className="h-5 w-5" />;
const RegistriesIcon = <BookIcon className="h-5 w-5" />;
const ActsIcon = (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 3a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);
const OrdersIcon = <ListIcon className="h-5 w-5" />;
const ArrowIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.586l-3.293-3.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink-900">{value}</p>
        <p className="text-xs text-ink-500">{label}</p>
      </div>
    </Card>
  );
}

function QuickAction({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
}) {
  return (
    <button
      onClick={() => navigate(to)}
      className="group flex w-full items-start gap-4 rounded-xl border border-ink-200 bg-white p-5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-ink-900">{title}</p>
        <p className="mt-0.5 text-sm text-ink-500">{description}</p>
      </div>
      <span className="mt-2 text-ink-300 transition-colors group-hover:text-brand-600">{ArrowIcon}</span>
    </button>
  );
}

function actLabel(act: ActEntry): string {
  const candidates = [
    act.data["Номер_акта"],
    act.data["Наименование_объекта"] ?? act.data["Наим_объект"],
  ].filter(Boolean);
  return candidates.slice(0, 2).join(" · ");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [templates, setTemplates] = useState<TemplateDef[] | null>(null);
  const [registries, setRegistries] = useState<Registry[] | null>(null);
  const [orderDirectives, setOrderDirectives] = useState<OrderDirective[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchRegistries(), fetchOrderDirectives()])
      .then(([t, r, o]) => {
        setTemplates(t);
        setRegistries(r);
        setOrderDirectives(o);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const loading = templates === null || registries === null || orderDirectives === null;

  const totalActs = registries?.reduce((sum, r) => sum + r.items.length, 0) ?? 0;
  const activeOrders = orderDirectives?.filter((o) => o.isActive).length ?? 0;

  const recentActs: RecentAct[] = (registries ?? [])
    .flatMap((registry) => registry.items.map((act) => ({ act, registry })))
    .sort((a, b) => b.act.createdAt.localeCompare(a.act.createdAt))
    .slice(0, 5)
    .map((entry) => ({ ...entry, template: templates?.find((t) => t.code === entry.act.templateCode) }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">Обзор</h2>
        <p className="mt-1 text-sm text-ink-500">
          Формируйте акты, ведите реестры и справочник приказов в одном месте.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
          Не удалось загрузить данные: {error}
        </div>
      )}

      {loading && !error && (
        <div className="flex items-center gap-2 py-8 text-sm text-ink-400">
          <Spinner /> Загрузка обзора...
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={TemplatesIcon} label="Типов документов" value={templates!.length} />
            <StatCard icon={RegistriesIcon} label="Реестров" value={registries!.length} />
            <StatCard icon={ActsIcon} label="Актов в реестрах" value={totalActs} />
            <StatCard icon={OrdersIcon} label="Активных приказов" value={activeOrders} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Быстрые действия
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickAction
                icon={TemplatesIcon}
                title="Сформировать документ"
                description="Выбрать шаблон и сгенерировать .docx"
                to="/generator"
              />
              <QuickAction
                icon={RegistriesIcon}
                title="Реестры актов"
                description="Создать или продолжить реестр"
                to="/registries"
              />
              <QuickAction
                icon={OrdersIcon}
                title="Приказы и распоряжения"
                description="Справочник ответственных лиц"
                to="/order-directives"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                Последние акты
              </h3>
              {recentActs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/registries")}>
                  Все реестры
                </Button>
              )}
            </div>

            {recentActs.length === 0 ? (
              <Card className="py-10 text-center text-sm text-ink-400">
                Актов пока нет — создайте реестр и добавьте первый акт.
              </Card>
            ) : (
              <div className="space-y-2">
                {recentActs.map(({ act, registry, template }) => (
                  <div
                    key={act.id}
                    onClick={() => navigate(`/registries/${registry.id}`)}
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-ink-200 bg-white p-4 hover:border-brand-300"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">
                        {template?.title ?? act.templateCode}
                      </p>
                      <p className="truncate text-sm text-ink-500">
                        {registry.name}
                        {actLabel(act) ? ` · ${actLabel(act)}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-400">{formatDate(act.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
