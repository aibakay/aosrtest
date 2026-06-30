import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass =
  "w-full rounded-lg border px-3 py-2 text-sm text-ink-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent";

function toneClass(error?: boolean, autoFilled?: boolean): string {
  if (error) return "border-danger-500 bg-danger-50";
  if (autoFilled) return "border-brand-300 bg-brand-50";
  return "border-ink-300";
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  autoFilled?: boolean;
}

export function Input({ error, autoFilled, className, ...rest }: InputProps) {
  return <input className={[baseClass, toneClass(error, autoFilled), className ?? ""].join(" ")} {...rest} />;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  autoFilled?: boolean;
}

export function Textarea({ error, autoFilled, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={[baseClass, "resize-y", toneClass(error, autoFilled), className ?? ""].join(" ")}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, className, ...rest }: SelectProps) {
  return <select className={[baseClass, toneClass(error), className ?? ""].join(" ")} {...rest} />;
}
