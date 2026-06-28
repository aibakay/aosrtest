import type { TemplateDef } from "../types";

const BASE = "/api";

export async function fetchTemplates(): Promise<TemplateDef[]> {
  const res = await fetch(`${BASE}/templates`);
  if (!res.ok) throw new Error(`Ошибка загрузки шаблонов: ${res.status}`);
  return res.json();
}

export async function generateDocument(
  templateCode: string,
  data: Record<string, string>
): Promise<Blob> {
  const res = await fetch(`${BASE}/documents/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateCode, data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
    const messages = err.errors
      ? err.errors.map((e: { message: string }) => e.message).join("\n")
      : err.error ?? "Ошибка генерации";
    throw new Error(messages);
  }

  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
