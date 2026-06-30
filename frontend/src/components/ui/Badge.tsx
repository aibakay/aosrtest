import type { ReactNode } from "react";

type Tone = "success" | "neutral" | "danger" | "brand";

const toneClass: Record<Tone, string> = {
  success: "bg-success-50 text-success-700",
  neutral: "bg-ink-100 text-ink-500",
  danger: "bg-danger-50 text-danger-700",
  brand: "bg-brand-100 text-brand-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={["rounded-full px-2 py-0.5 text-xs font-medium", toneClass[tone]].join(" ")}>
      {children}
    </span>
  );
}
