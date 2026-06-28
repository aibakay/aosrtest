import type { TemplateDef, Order, RoleOption, ResolveResponse } from "../types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

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

// ── Orders / directives registry ──────────────────────────────────────────

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({}));
  if (err.errors) return (err.errors as string[]).join("\n");
  return err.error ?? `Ошибка ${res.status}`;
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const res = await fetch(`${BASE}/orders/roles`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE}/orders`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createOrder(order: Omit<Order, "id">): Promise<Order> {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateOrder(id: string, order: Omit<Order, "id">): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${BASE}/orders/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
}

export async function resolveOrders(date: string, roles?: string[]): Promise<ResolveResponse> {
  const res = await fetch(`${BASE}/orders/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, roles }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
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
