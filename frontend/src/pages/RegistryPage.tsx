import { useEffect, useState } from "react";
import type { Registry, ActEntry, TemplateDef, SelectedOrderDirective } from "../types";
import { fetchRegistry, addAct, updateAct, deleteAct, generateRegistry } from "../api/registries";
import { fetchTemplates, generateDocument, downloadBlob } from "../api/client";
import { DocumentForm } from "../components/DocumentForm";
import { navigate } from "../router";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Spinner } from "../components/ui/Spinner";
import { ListItemCard } from "../components/ui/ListItemCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

interface Props {
  registryId: string;
}

type Mode =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; act: ActEntry };

const BackIcon = (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);
const GenerateAllIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const AddIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);
const CloseIcon = (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const DocxIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);
const ActsEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default function RegistryPage({ registryId }: Props) {
  const toast = useToast();
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ActEntry | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchRegistry(registryId), fetchTemplates()])
      .then(([reg, tmpl]) => {
        setRegistry(reg);
        setTemplates(tmpl);
        if (tmpl.length > 0) setSelectedTemplateCode(tmpl[0].code);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [registryId]);

  const selectedTemplate = templates.find((t) => t.code === selectedTemplateCode) ?? null;

  const handleSaveNew = async (data: Record<string, string>, orderDirectives: SelectedOrderDirective[]) => {
    if (!selectedTemplate) return;
    const updated = await addAct(registryId, {
      templateCode: selectedTemplate.code,
      data,
      orderDirectives,
    });
    setRegistry(updated);
    setMode({ kind: "list" });
    toast.show("Акт добавлен в реестр", "success");
  };

  const handleSaveEdit = (act: ActEntry) => async (data: Record<string, string>, orderDirectives: SelectedOrderDirective[]) => {
    const updated = await updateAct(registryId, act.id, {
      templateCode: act.templateCode,
      data,
      orderDirectives,
    });
    setRegistry(updated);
    setMode({ kind: "list" });
    toast.show("Акт обновлён", "success");
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    const actId = confirmTarget.id;
    setDeletingId(actId);
    try {
      const updated = await deleteAct(registryId, actId);
      setRegistry(updated);
      toast.show("Акт удалён", "success");
    } catch (e) {
      toast.show(String(e), "error");
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!registry) return;
    setGeneratingAll(true);
    try {
      const blob = await generateRegistry(registryId);
      const safeRegName = registry.name.replace(/[^\wА-яЁё\s-]/g, "_").trim() || "реестр";
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${safeRegName}_${today}.zip`);
    } catch (e) {
      toast.show(String(e), "error");
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleGenerate = async (act: ActEntry) => {
    const tmpl = templates.find((t) => t.code === act.templateCode);
    if (!tmpl) return;
    setGeneratingId(act.id);
    try {
      const result = await generateDocument(act.templateCode, act.data, act.orderDirectives ?? []);
      downloadBlob(result.blob, result.fileName);
    } catch (e) {
      toast.show(String(e), "error");
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-ink-400">
        <Spinner /> Загрузка...
      </div>
    );
  }

  if (error || !registry) {
    return (
      <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
        {error ?? "Реестр не найден"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/registries")}
          className="mt-1 text-ink-400 transition-colors hover:text-ink-600"
          title="Назад к реестрам"
        >
          {BackIcon}
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-ink-900">{registry.name}</h2>
          {registry.objectName && <p className="mt-0.5 text-sm text-ink-500">{registry.objectName}</p>}
          <p className="mt-1 text-xs text-ink-400">
            {registry.items.length} {actWord(registry.items.length)} · ID: {registry.id}
          </p>
        </div>

        {mode.kind === "list" && (
          <div className="flex shrink-0 items-center gap-2">
            {registry.items.length > 0 && (
              <Button
                variant="secondary"
                icon={GenerateAllIcon}
                loading={generatingAll}
                onClick={handleGenerateAll}
                title="Сгенерировать все акты и реестр в один ZIP"
              >
                Сформировать реестр
              </Button>
            )}
            <Button icon={AddIcon} onClick={() => setMode({ kind: "add" })}>
              Добавить акт
            </Button>
          </div>
        )}
      </div>

      {/* Add mode */}
      {mode.kind === "add" && (
        <Card highlight className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-800">Новый акт</h3>
            <button onClick={() => setMode({ kind: "list" })} className="text-ink-400 hover:text-ink-600">
              {CloseIcon}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-600">Тип акта</label>
            <Select value={selectedTemplateCode} onChange={(e) => setSelectedTemplateCode(e.target.value)}>
              {templates.map((t) => (
                <option key={t.code} value={t.code}>{t.title}</option>
              ))}
            </Select>
          </div>

          {selectedTemplate && (
            <DocumentForm
              key={`add-${selectedTemplate.code}`}
              template={selectedTemplate}
              onSave={handleSaveNew}
              initialValues={
                registry.objectFields && Object.values(registry.objectFields).some((v) => v?.trim())
                  ? registry.objectFields
                  : undefined
              }
            />
          )}
        </Card>
      )}

      {/* Edit mode */}
      {mode.kind === "edit" && (() => {
        const act = mode.act;
        const tmpl = templates.find((t) => t.code === act.templateCode);
        return tmpl ? (
          <Card highlight className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-800">Редактирование акта</h3>
              <button onClick={() => setMode({ kind: "list" })} className="text-ink-400 hover:text-ink-600">
                {CloseIcon}
              </button>
            </div>
            <p className="text-sm text-ink-500">{tmpl.title}</p>
            <DocumentForm
              key={`edit-${act.id}`}
              template={tmpl}
              initialValues={act.data}
              initialOrderDirectives={act.orderDirectives}
              onSave={handleSaveEdit(act)}
            />
          </Card>
        ) : null;
      })()}

      {/* Acts list */}
      {mode.kind === "list" && (
        <>
          {registry.items.length === 0 ? (
            <EmptyState icon={ActsEmptyIcon} message="В реестре нет актов — добавьте первый" />
          ) : (
            <div className="space-y-3">
              {registry.items.map((act, idx) => {
                const tmpl = templates.find((t) => t.code === act.templateCode);
                const label = actLabel(act);
                return (
                  <ListItemCard
                    key={act.id}
                    index={idx + 1}
                    title={tmpl?.title ?? act.templateCode}
                    subtitle={label || undefined}
                    meta={formatDate(act.createdAt)}
                    actions={
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={DocxIcon}
                          loading={generatingId === act.id}
                          onClick={() => handleGenerate(act)}
                          title="Сформировать .docx"
                          className="text-success-700 hover:bg-success-50"
                        >
                          .docx
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setMode({ kind: "edit", act })}>
                          Изменить
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="sm"
                          loading={deletingId === act.id}
                          onClick={() => setConfirmTarget(act)}
                        >
                          Удалить
                        </Button>
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Удалить акт?"
        message="Акт будет удалён из реестра без возможности восстановления."
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

function actLabel(act: ActEntry): string {
  const candidates = [
    act.data["Номер_акта"],
    act.data["Наименование_объекта"] ?? act.data["Наим_объект"],
    act.data["Наименование_работ"] ?? act.data["Наим_работ"],
  ].filter(Boolean);
  return candidates.slice(0, 2).join(" · ");
}
