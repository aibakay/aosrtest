import type {
  OrderDirective,
  OrderDirectiveInput,
  ActiveDirectivesResult,
} from "../types";

const BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  (import.meta.env.PROD
    ? "https://jubilant-unity-production-cdbb.up.railway.app/api"
    : "/api")
);
const URL = `${BASE}/order-directives`;

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
  if (err.errors) return err.errors.map((e: { message: string }) => e.message).join("\n");
  return err.error ?? `Ошибка запроса: ${res.status}`;
}

export async function fetchOrderDirectives(): Promise<OrderDirective[]> {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchActiveOnDate(date: string): Promise<ActiveDirectivesResult> {
  const res = await fetch(`${URL}/active?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createOrderDirective(
  input: OrderDirectiveInput
): Promise<OrderDirective> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateOrderDirective(
  id: string,
  input: OrderDirectiveInput
): Promise<OrderDirective> {
  const res = await fetch(`${URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

/** Soft-delete (deactivate). Pass hard=true to remove permanently. */
export async function deleteOrderDirective(id: string, hard = false): Promise<void> {
  const res = await fetch(`${URL}/${id}${hard ? "?hard=true" : ""}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
