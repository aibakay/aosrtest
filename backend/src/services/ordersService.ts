import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Order, ResolvedOrder, ResolveResponse } from "../types";
import { ORDER_ROLES, ROLE_MAP } from "../config/orders";

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

const MONTHS_RU = [
  "", "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDateRu(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_RU[d.getMonth() + 1]} ${d.getFullYear()} г.`;
}

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readAll(): Order[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: Order[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

export function listOrders(): Order[] {
  return readAll().sort((a, b) => (a.date < b.date ? 1 : -1));
}

const VALID_KINDS = ["приказ", "распоряжение"];

function validateOrder(o: Partial<Order>): string[] {
  const errs: string[] = [];
  if (!o.kind || !VALID_KINDS.includes(o.kind)) errs.push("Поле «тип» должно быть «приказ» или «распоряжение»");
  if (!o.number?.trim()) errs.push("Не указан номер документа");
  if (!o.date?.trim()) errs.push("Не указана дата издания");
  if (!o.role || !ROLE_MAP[o.role]) errs.push("Не указана корректная роль ответственного лица");
  if (!o.fio?.trim()) errs.push("Не указано ФИО ответственного лица");
  if (o.validFrom && o.validTo && o.validFrom > o.validTo) {
    errs.push("«Действует с» не может быть позже «действует по»");
  }
  return errs;
}

export function createOrder(input: Partial<Order>): { order?: Order; errors: string[] } {
  const errors = validateOrder(input);
  if (errors.length) return { errors };
  const order: Order = {
    id: randomUUID(),
    kind: input.kind!,
    number: input.number!.trim(),
    date: input.date!,
    organization: input.organization?.trim() ?? "",
    role: input.role!,
    position: input.position?.trim() ?? "",
    fio: input.fio!.trim(),
    validFrom: input.validFrom || undefined,
    validTo: input.validTo || undefined,
  };
  const all = readAll();
  all.push(order);
  writeAll(all);
  return { order, errors: [] };
}

export function updateOrder(id: string, input: Partial<Order>): { order?: Order; errors: string[]; notFound?: boolean } {
  const all = readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx === -1) return { errors: ["Документ не найден"], notFound: true };
  const merged = { ...all[idx], ...input, id };
  const errors = validateOrder(merged);
  if (errors.length) return { errors };
  const order: Order = {
    id,
    kind: merged.kind!,
    number: merged.number!.trim(),
    date: merged.date!,
    organization: merged.organization?.trim() ?? "",
    role: merged.role!,
    position: merged.position?.trim() ?? "",
    fio: merged.fio!.trim(),
    validFrom: merged.validFrom || undefined,
    validTo: merged.validTo || undefined,
  };
  all[idx] = order;
  writeAll(all);
  return { order, errors: [] };
}

export function deleteOrder(id: string): boolean {
  const all = readAll();
  const next = all.filter((o) => o.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}

// Does the order's validity interval contain the given date?
function covers(order: Order, date: string): boolean {
  if (order.validFrom && date < order.validFrom) return false;
  if (order.validTo && date > order.validTo) return false;
  return true;
}

// Build the basis string and bookmark values for a resolved order.
function buildFields(order: Order): Record<string, string> {
  const role = ROLE_MAP[order.role];
  if (!role) return {};
  const basis = `${order.kind} № ${order.number} от ${formatDateRu(order.date)}`;
  const position = order.position
    ? `${order.position}, ${basis}`
    : basis;
  return {
    [role.posBookmark]: position,
    [role.fioBookmark]: order.fio,
  };
}

// For a given completion date, choose the best order per role.
// 1. Prefer orders whose [validFrom, validTo] interval covers the date,
//    taking the one with the latest validFrom (most recent appointment).
// 2. Otherwise fall back to the most recent order issued on or before the date.
export function resolveByDate(date: string, roles?: string[]): ResolveResponse {
  const all = readAll();
  const wantedRoles = (roles && roles.length ? roles : ORDER_ROLES.map((r) => r.key))
    .filter((k) => ROLE_MAP[k]);

  const resolved: ResolvedOrder[] = [];
  const unmatched: string[] = [];
  const mergedFields: Record<string, string> = {};

  for (const roleKey of wantedRoles) {
    const candidates = all.filter((o) => o.role === roleKey);
    if (!candidates.length) {
      unmatched.push(roleKey);
      continue;
    }

    const covering = candidates
      .filter((o) => covers(o, date))
      .sort((a, b) => (a.validFrom ?? a.date) < (b.validFrom ?? b.date) ? 1 : -1);

    let chosen: Order | undefined = covering[0];
    let fallback = false;

    if (!chosen) {
      const past = candidates
        .filter((o) => o.date <= date)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      chosen = past[0] ?? candidates.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      fallback = true;
    }

    if (!chosen) {
      unmatched.push(roleKey);
      continue;
    }

    const fields = buildFields(chosen);
    Object.assign(mergedFields, fields);
    resolved.push({
      role: roleKey,
      label: ROLE_MAP[roleKey].label,
      order: chosen,
      fallback,
      fields,
    });
  }

  return { date, resolved, unmatched, fields: mergedFields };
}
