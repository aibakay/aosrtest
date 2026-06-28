import { useEffect, useState } from "react";
import type { TemplateDef } from "./types";
import { fetchTemplates } from "./api/client";
import { TemplateSelector } from "./components/TemplateSelector";
import { DocumentForm } from "./components/DocumentForm";

export default function App() {
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch((e) => setLoadError(String(e)));
  }, []);

  const selected = templates.find((t) => t.code === selectedCode) ?? null;

  const handleSelect = (code: string) => {
    setSelectedCode(code);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Автогенератор ИД</h1>
          <p className="text-sm text-gray-500 mt-1">Формирование исполнительной документации</p>
        </div>

        {loadError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            Не удалось загрузить шаблоны: {loadError}
          </div>
        )}

        {templates.length === 0 && !loadError && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Загрузка шаблонов...
          </div>
        )}

        {templates.length > 0 && (
          <>
            <TemplateSelector
              templates={templates}
              selected={selectedCode}
              onSelect={handleSelect}
            />

            {selected ? (
              <div>
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">{selected.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
                </div>
                <DocumentForm key={selected.code} template={selected} />
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <svg className="h-12 w-12 mx-auto mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm">Выберите тип документа выше</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
