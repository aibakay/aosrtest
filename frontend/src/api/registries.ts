import type { Registry, RegistryInput, ActEntryInput } from "../types";

const BASE = (
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  (import.meta.env.PROD
    ? "https://jubilant-unity-production-cdbb.up.railway.app/api"
    : "/api")
);
const URL_BASE = `${BASE}/registries`;

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
  return err.error ?? `Ошибка: ${res.status}`;
}

export async function fetchRegistries(): Promise<Registry[]> {
  const res = await fetch(URL_BASE);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchRegistry(id: string): Promise<Registry> {
  const res = await fetch(`${URL_BASE}/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createRegistry(input: RegistryInput): Promise<Registry> {
  const res = await fetch(URL_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateRegistry(
  id: string,
  input: Partial<RegistryInput>
): Promise<Registry> {
  const res = await fetch(`${URL_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteRegistry(id: string): Promise<void> {
  const res = await fetch(`${URL_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function addAct(
  registryId: string,
  input: ActEntryInput
): Promise<Registry> {
  const res = await fetch(`${URL_BASE}/${registryId}/acts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function updateAct(
  registryId: string,
  actId: string,
  input: Partial<ActEntryInput>
): Promise<Registry> {
  const res = await fetch(`${URL_BASE}/${registryId}/acts/${actId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteAct(
  registryId: string,
  actId: string
): Promise<Registry> {
  const res = await fetch(`${URL_BASE}/${registryId}/acts/${actId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function generateRegistry(registryId: string): Promise<Blob> {
  const res = await fetch(`${URL_BASE}/${registryId}/generate`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}
