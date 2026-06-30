import type { ReactNode } from "react";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  index?: number;
  actions?: ReactNode;
  onClick?: () => void;
}

export function ListItemCard({ title, subtitle, meta, index, actions, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={[
        "flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4",
        onClick ? "cursor-pointer hover:border-brand-300 transition-colors" : "",
      ].join(" ")}
    >
      {index !== undefined && (
        <span className="w-6 shrink-0 text-center font-mono text-xs text-ink-400">{index}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-900">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-sm text-ink-500">{subtitle}</p>}
        {meta && <p className="mt-1 text-xs text-ink-400">{meta}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
