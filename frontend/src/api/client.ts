import type { TemplateDef, SelectedOrderDirective } from "../types";
import { API_BASE as BASE } from "./config";

export async function fetchTemplates(): Promise<TemplateDef[]> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error(`Ошибка загрузки шаблонов: ${res.status}`);
  return res.json();
}

export interface GenerateResult {
  blob: Blob;
  /** Suggested filename extracted from Content-Disposition (if present). */
  fileName: string;
  /** true when the response is a ZIP bundle (act + quality registry). */
  isBundle: boolean;
}

export async function generateDocument(
  templateCode: string,
  data: Record<string, string>,
  orderDirectives?: SelectedOrderDirective[]
): Promise<GenerateResult> {
  const res = await fetch(`${BASE}/documents/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateCode, data, orderDirectives }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
    const messages = err.errors
      ? err.errors.map((e: { message: string }) => e.message).join("\n")
      : err.error ?? "Ошибка генерации";
    throw new Error(messages);
  }

  const isBundle = res.headers.get("Content-Type")?.includes("application/zip") ?? false;

  // Extract filename from Content-Disposition: attachment; filename*=UTF-8''<encoded>
  let fileName = isBundle ? `Пакет_документов.zip` : `${templateCode}.docx`;
  const cd = res.headers.get("Content-Disposition") ?? "";
  const fnMatch = cd.match(/filename\*=UTF-8''(.+)/i) ?? cd.match(/filename="?([^";]+)"?/i);
  if (fnMatch) {
    try { fileName = decodeURIComponent(fnMatch[1]); } catch { /* keep default */ }
  }

  return { blob: await res.blob(), fileName, isBundle };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
