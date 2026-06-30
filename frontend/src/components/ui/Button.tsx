import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary:
    "bg-white text-ink-700 border border-ink-200 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50",
  ghost: "text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-50",
  danger: "bg-danger-500 text-white hover:bg-danger-700 disabled:opacity-50",
  "danger-ghost": "text-danger-500 hover:bg-danger-50 disabled:opacity-40",
};

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  disabled,
  children,
  className,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center gap-2 rounded-lg font-medium transition-colors",
        variantClass[variant],
        sizeClass[size],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}
