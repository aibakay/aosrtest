import { randomUUID } from "crypto";
import {
  OrderDirective,
  OrderDirectiveInput,
  ActiveDirectivesResult,
  ActiveRoleGroup,
  ValidationError,
} from "../types";
import { orderDirectiveRepository } from "../repositories/orderDirectiveRepository";

const repo = orderDirectiveRepository;

export function listDirectives(): OrderDirective[] {
  return repo.getAll();
}

export function getDirective(id: string): OrderDirective | undefined {
  return repo.getById(id);
}

export function validateInput(input: Partial<OrderDirectiveInput>): ValidationError[] {
  const errors: ValidationError[] = [];
  const required: Array<[keyof OrderDirectiveInput, string]> = [
    ["type", "Тип документа"],
    ["number", "Номер"],
    ["date", "Дата документа"],
    ["role", "Роль в ИД"],
    ["validFrom", "Дата начала действия"],
  ];
  for (const [key, label] of required) {
    const v = input[key];
    if (v === undefined || v === null || String(v).trim() === "") {
      errors.push({ field: String(key), message: `Поле "${label}" обязательно` });
    }
  }
  if (input.type && input.type !== "order" && input.type !== "directive") {
    errors.push({ field: "type", message: "Тип должен быть order или directive" });
  }
  if (input.validTo && input.validFrom && input.validTo < input.validFrom) {
    errors.push({ field: "validTo", message: "Дата окончания раньше даты начала" });
  }
  return errors;
}

function normalize(input: OrderDirectiveInput): OrderDirectiveInput {
  return {
    type: input.type,
    number: input.number ?? "",
    date: input.date ?? "",
    title: input.title ?? "",
    responsiblePersonName: input.responsiblePersonName ?? "",
    responsiblePersonPosition: input.responsiblePersonPosition ?? "",
    role: input.role ?? "",
    validFrom: input.validFrom ?? "",
    validTo: input.validTo ? input.validTo : null,
    organization: input.organization ?? "",
    basisText: input.basisText ?? "",
    comment: input.comment ?? "",
    isActive: input.isActive ?? true,
  };
}

export function createDirective(input: OrderDirectiveInput): OrderDirective {
  const record: OrderDirective = { id: randomUUID(), ...normalize(input) };
  return repo.create(record);
}

export function updateDirective(
  id: string,
  input: OrderDirectiveInput
): OrderDirective | undefined {
  return repo.update(id, normalize(input));
}

/** Soft-delete: deactivate instead of removing, unless hard=true. */
export function deactivateDirective(id: string): OrderDirective | undefined {
  return repo.update(id, { isActive: false });
}

export function deleteDirective(id: string): boolean {
  return repo.remove(id);
}

/**
 * A directive is in force on `date` when it is active and:
 *   validFrom <= date  AND  (validTo is empty OR validTo >= date)
 * Date strings are ISO (YYYY-MM-DD), so lexical comparison is correct.
 */
export function isInForceOn(d: OrderDirective, date: string): boolean {
  if (!d.isActive) return false;
  if (!d.validFrom || d.validFrom > date) return false;
  if (d.validTo && d.validTo < date) return false;
  return true;
}

/**
 * Auto-selection rule. Returns active directives grouped by role.
 * For each role the most recent by validFrom is pre-selected; when a role
 * has more than one match a warning is emitted so the UI can prompt the user.
 */
export function getActiveOn(date: string): ActiveDirectivesResult {
  const active = repo.getAll().filter((d) => isInForceOn(d, date));

  const byRole = new Map<string, OrderDirective[]>();
  for (const d of active) {
    if (!byRole.has(d.role)) byRole.set(d.role, []);
    byRole.get(d.role)!.push(d);
  }

  const groups: ActiveRoleGroup[] = [];
  const warnings: string[] = [];

  for (const [role, candidates] of byRole) {
    const sorted = [...candidates].sort((a, b) => b.validFrom.localeCompare(a.validFrom));
    const selected = sorted[0] ?? null;
    const hasMultiple = sorted.length > 1;
    if (hasMultiple) {
      warnings.push(
        `Для роли «${role}» найдено несколько действующих документов (${sorted.length}). ` +
          `Автоматически выбран самый свежий (№ ${selected?.number} от ${selected?.date}).`
      );
    }
    groups.push({ role, candidates: sorted, selected, hasMultiple });
  }

  groups.sort((a, b) => a.role.localeCompare(b.role, "ru"));
  return { date, groups, warnings };
}
