import type { TemplateDef } from "../types";

interface Props {
  templates: TemplateDef[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export function TemplateSelector({ templates, selected, onSelect }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-ink-800 mb-3">Тип документа</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {templates.map((t) => (
          <button
            key={t.code}
            onClick={() => onSelect(t.code)}
            title={t.description}
            className={[
              "px-3 py-2 rounded-lg border text-sm font-medium text-left transition-all",
              selected === t.code
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50",
            ].join(" ")}
          >
            <div className="font-semibold">{t.title}</div>
            <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
