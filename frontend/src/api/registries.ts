import type { Registry, RegistryInput, ActEntryInput } from "../types";
import { API_BASE as BASE, apiFetch } from "./config";

const URL_BASE = `${BASE}/registries`;

export interface ActFailure {
  actId: string;
  templateCode: string;
  error: string;
}

async function parseError(res: Response): Promise<string> {
  const err = await res.json().catch(() => ({ error: "Неизвестная ошибка" }));
  const base = err.error ?? `Ошибка: ${res.status}`;
  if (Array.isArray(err.failures) && err.failures.length > 0) {
    const details = (err.failures as ActFailure[])
      .map((f) => `${f.templateCode}: ${f.error}`)
      .join("\n");
    return `${base}\n${details}`;
  }
  return base;
}

export async function fetchRegistries(): Promise<Registry[]> {
  const res = await apiFetch(URL_BASE);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchRegistry(id: string): Promise<Registry> {
  const res = await apiFetch(`${URL_BASE}/${id}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createRegistry(input: RegistryInput): Promise<Registry> {
  const res = await apiFetch(URL_BASE, {
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
  const res = await apiFetch(`${URL_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function deleteRegistry(id: string): Promise<void> {
  const res = await apiFetch(`${URL_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function addAct(
  registryId: string,
  input: ActEntryInput
): Promise<Registry> {
  const res = await apiFetch(`${URL_BASE}/${registryId}/acts`, {
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
  const res = await apiFetch(`${URL_BASE}/${registryId}/acts/${actId}`, {
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
  const res = await apiFetch(`${URL_BASE}/${registryId}/acts/${actId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function generateRegistry(
  registryId: string
): Promise<{ blob: Blob; fileName: string; failures: ActFailure[] }> {
  const res = await apiFetch(`${URL_BASE}/${registryId}/generate`, { method: "POST" });
  if (!res.ok) throw new Error(await parseError(res));

  let fileName = "Пакет_документов.zip";
  const cd = res.headers.get("Content-Disposition") ?? "";
  const fnMatch = cd.match(/filename\*=UTF-8''(.+)/i) ?? cd.match(/filename="?([^";]+)"?/i);
  if (fnMatch) {
    try { fileName = decodeURIComponent(fnMatch[1]); } catch { /* keep default */ }
  }

  let failures: ActFailure[] = [];
  const warningsHeader = res.headers.get("X-Registry-Warnings");
  if (warningsHeader) {
    try { failures = JSON.parse(decodeURIComponent(warningsHeader)); } catch { /* ignore */ }
  }

  return { blob: await res.blob(), fileName, failures };
}
