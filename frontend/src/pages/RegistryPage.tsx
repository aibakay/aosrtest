import { useEffect, useState } from "react";
import type { Registry, ActEntry, TemplateDef, SelectedOrderDirective } from "../types";
import { fetchRegistry, addAct, updateAct, deleteAct, generateRegistry } from "../api/registries";
import { fetchTemplates, generateDocument, downloadBlob } from "../api/client";
import { DocumentForm } from "../components/DocumentForm";
import { navigate } from "../router";

interface Props {
  registryId: string;
}

type Mode =
  | { kind: "list" }
  | { kind: "add" }
  | { kind: "edit"; act: ActEntry };

export default function RegistryPage({ registryId }: Props) {
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  };

  const handleSaveEdit = (act: ActEntry) => async (data: Record<string, string>, orderDirectives: SelectedOrderDirective[]) => {
    const updated = await updateAct(registryId, act.id, {
      templateCode: act.templateCode,
      data,
      orderDirectives,
    });
    setRegistry(updated);
    setMode({ kind: "list" });
  };

  const handleDelete = async (actId: string) => {
    if (!confirm("Удалить акт из реестра?")) return;
    setDeletingId(actId);
    try {
      const updated = await deleteAct(registryId, actId);
      setRegistry(updated);
    } catch (e) {
      alert(String(e));
    } finally {
      setDeletingId(null);
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
      alert(String(e));
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
      alert(String(e));
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        Загрузка...
      </div>
    );
  }

  if (error || !registry) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
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
          className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Назад к реестрам"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{registry.name}</h2>
          {registry.objectName && (
            <p className="text-sm text-gray-500 mt-0.5">{registry.objectName}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {registry.items.length} {actWord(registry.items.length)} · ID: {registry.id}
          </p>
        </div>

        {mode.kind === "list" && (
          <div className="flex items-center gap-2 shrink-0">
            {registry.items.length > 0 && (
              <button
                onClick={handleGenerateAll}
                disabled={generatingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                title="Сгенерировать все акты и реестр в один ZIP"
              >
                {generatingAll ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Генерация...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Сформировать реестр
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setMode({ kind: "add" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Добавить акт
            </button>
          </div>
        )}
      </div>

      {/* Add mode */}
      {mode.kind === "add" && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Новый акт</h3>
            <button
              onClick={() => setMode({ kind: "list" })}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Тип акта</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTemplateCode}
              onChange={(e) => setSelectedTemplateCode(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.code} value={t.code}>{t.title}</option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <DocumentForm
              key={`add-${selectedTemplate.code}`}
              template={selectedTemplate}
              onSave={handleSaveNew}
            />
          )}
        </div>
      )}

      {/* Edit mode */}
      {mode.kind === "edit" && (() => {
        const act = mode.act;
        const tmpl = templates.find((t) => t.code === act.templateCode);
        return tmpl ? (
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Редактирование акта</h3>
              <button
                onClick={() => setMode({ kind: "list" })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500">{tmpl.title}</p>
            <DocumentForm
              key={`edit-${act.id}`}
              template={tmpl}
              initialValues={act.data}
              initialOrderDirectives={act.orderDirectives}
              onSave={handleSaveEdit(act)}
            />
          </div>
        ) : null;
      })()}

      {/* Acts list */}
      {mode.kind === "list" && (
        <>
          {registry.items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="h-10 w-10 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">В реестре нет актов — добавьте первый</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registry.items.map((act, idx) => {
                const tmpl = templates.find((t) => t.code === act.templateCode);
                const label = actLabel(act, templates);
                return (
                  <div key={act.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <span className="text-xs font-mono text-gray-400 w-6 text-center shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {tmpl?.title ?? act.templateCode}
                      </p>
                      {label && <p className="text-sm text-gray-500 truncate mt-0.5">{label}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(act.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleGenerate(act)}
                        disabled={generatingId === act.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-40"
                        title="Сформировать .docx"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {generatingId === act.id ? "..." : ".docx"}
                      </button>
                      <button
                        onClick={() => setMode({ kind: "edit", act })}
                        className="px-3 py-1.5 rounded-lg text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(act.id)}
                        disabled={deletingId === act.id}
                        className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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

function actLabel(act: ActEntry, templates: TemplateDef[]): string {
  const candidates = [
    act.data["Номер_акта"],
    act.data["Наим_объект"],
    act.data["Наим_работ"],
  ].filter(Boolean);
  return candidates.slice(0, 2).join(" · ");
}
