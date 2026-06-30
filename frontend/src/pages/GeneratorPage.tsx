import { useEffect, useState } from "react";
import type { TemplateDef } from "../types";
import { fetchTemplates } from "../api/client";
import { TemplateSelector } from "../components/TemplateSelector";
import { DocumentForm } from "../components/DocumentForm";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";

const DocIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export default function GeneratorPage() {
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch((e) => setLoadError(String(e)));
  }, []);

  const selected = templates.find((t) => t.code === selectedCode) ?? null;

  return (
    <>
      {loadError && (
        <div className="rounded-lg bg-danger-50 border border-danger-500/30 p-4 text-sm text-danger-700 mb-6">
          Не удалось загрузить шаблоны: {loadError}
        </div>
      )}

      {templates.length === 0 && !loadError && (
        <div className="flex items-center gap-2 text-ink-400 text-sm">
          <Spinner /> Загрузка шаблонов...
        </div>
      )}

      {templates.length > 0 && (
        <>
          <TemplateSelector
            templates={templates}
            selected={selectedCode}
            onSelect={setSelectedCode}
          />

          {selected ? (
            <div>
              <div className="mb-6 pb-4 border-b border-ink-200">
                <h2 className="text-xl font-semibold text-ink-900">{selected.title}</h2>
                <p className="text-sm text-ink-500 mt-1">{selected.description}</p>
              </div>
              <DocumentForm key={selected.code} template={selected} />
            </div>
          ) : (
            <EmptyState icon={DocIcon} message="Выберите тип документа выше" />
          )}
        </>
      )}
    </>
  );
}
