import type { ReactNode } from "react";

export function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-ink-400">
      <div className="mx-auto mb-3 h-10 w-10 opacity-40">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
