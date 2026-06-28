// Roles of responsible persons that can be appointed by an order/directive
// (приказ/распоряжение). Each role maps to the signatory bookmarks used in
// construction acts (Должность_<role> / ФИО_<role>).

export interface RoleDef {
  key: string;          // role identifier (stored on the order)
  label: string;        // human-readable role name (UI)
  posBookmark: string;  // bookmark for the position field
  fioBookmark: string;  // bookmark for the ФИО field
}

export const ORDER_ROLES: RoleDef[] = [
  { key: "ТНЗ", label: "Технадзор заказчика",          posBookmark: "Должность_ТНЗ", fioBookmark: "ФИО_ТНЗ" },
  { key: "Г",   label: "Генподрядчик",                  posBookmark: "Должность_Г",   fioBookmark: "ФИО_Г" },
  { key: "ТНГ", label: "Стройконтроль генподрядчика",   posBookmark: "Должность_ТНГ", fioBookmark: "ФИО_ТНГ" },
  { key: "Пр",  label: "Авторский надзор",              posBookmark: "Должность_Пр",  fioBookmark: "ФИО_Пр" },
  { key: "Пд",  label: "Подрядчик (производитель работ)", posBookmark: "Должность_Пд", fioBookmark: "ФИО_Пд" },
  { key: "И1",  label: "Иное лицо 1",                   posBookmark: "Должность_И1",  fioBookmark: "ФИО_И1" },
  { key: "И2",  label: "Иное лицо 2",                   posBookmark: "Должность_И2",  fioBookmark: "ФИО_И2" },
  { key: "И3",  label: "Иное лицо 3",                   posBookmark: "Должность_И3",  fioBookmark: "ФИО_И3" },
];

export const ROLE_MAP: Record<string, RoleDef> = Object.fromEntries(
  ORDER_ROLES.map((r) => [r.key, r])
);
