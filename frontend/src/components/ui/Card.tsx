import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  highlight?: boolean;
}

export function Card({ children, highlight, className, ...rest }: Props) {
  return (
    <div
      className={[
        "rounded-xl border bg-white p-5",
        highlight ? "border-brand-200 shadow-sm" : "border-ink-200",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
