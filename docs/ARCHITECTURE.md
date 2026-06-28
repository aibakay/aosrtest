# ARCHITECTURE.md

Архитектура веб-замены Excel/VBA-автогенератора исполнительной документации.

## Общая идея
Воспроизводим механизм оригинала (заполнение **Word-закладок** в `.docx`) на стеке Node + React.
COM/Word не используется — `.docx` правится напрямую как ZIP/XML.

```
Браузер (React+TS+Tailwind)
   │  GET /api/templates        → список типов и полей (из закладок)
   │  POST /api/documents/generate (JSON) → .docx (поток на скачивание)
   ▼
Express API (Node+TS)
   ├─ templateService   — читает [Шаблоны], извлекает закладки, строит схему полей
   ├─ validationService — проверяет обязательные поля
   ├─ generatorService  — заполняет закладки в копии шаблона, отдаёт .docx
   └─ output/           — сохранённые файлы
   ▼
Шаблоны (read-only) ← оригиналы из source/[Шаблоны]
```

## Backend (`/backend`)

### Стек
Node.js, Express, TypeScript, `pizzip` (распаковка docx), прямая правка `word/document.xml`.
(docxtemplater не подходит для bookmark-based шаблонов «как есть»; используем собственный bookmark-filler.
Альтернатива — конверсия шаблонов в `{плейсхолдеры}` для docxtemplater; решается на этапе backend, оригиналы не трогаем.)

### Структура
```
backend/
  src/
    server.ts            — точка входа Express
    routes/              — health, templates, documents
    services/
      templateService.ts — реестр шаблонов + извлечение закладок
      bookmarkFiller.ts  — вставка значений в закладки docx
      validationService.ts
    config/templates.ts  — метаданные типов (код, название, обяз. поля, группы)
    types.ts
  templates/             — рабочие копии шаблонов (НЕ оригиналы)
  output/                — сгенерированные .docx
```

### Эндпоинты
- `GET /api/health` → `{ status: "ok" }`
- `GET /api/templates` → `[{ code, title, description, fields:[{name,label,type,required,group}] }]`
  Поля выводятся из закладок шаблона + словаря человекочитаемых подписей.
- `POST /api/documents/generate`
  - body: `{ templateCode: string, data: Record<string,string> }`
  - валидирует обязательные поля → 400 с понятным сообщением при ошибке;
  - копирует шаблон, заполняет закладки, раскладывает дату на день/месяц(словом)/год;
  - сохраняет в `output/`, возвращает `.docx` с `Content-Disposition: attachment`.

### Заполнение закладок
В `document.xml` закладка = пара `<w:bookmarkStart w:name="X" w:id="N"/> … <w:bookmarkEnd w:id="N"/>`.
Алгоритм: найти `bookmarkStart`, вставить run с текстом сразу после него (внутри диапазона закладки),
сохранив существующее форматирование первого run в том же абзаце. Месяц форматируется в родительный падеж.

## Frontend (`/frontend`)

### Стек
React, TypeScript, Vite, Tailwind CSS.

### Структура
```
frontend/src/
  api/client.ts          — fetch к backend
  components/
    TemplateSelector.tsx  — выбор типа документа (из /api/templates)
    DocumentForm.tsx      — динамическая форма по схеме полей
    FormSection.tsx       — группировка полей (Объект / Стороны / Даты / Подписанты / Содержание)
    DownloadButton.tsx
  state/                  — состояние формы, loading, error
  App.tsx
```

### Поведение
1. На старте грузит `/api/templates`.
2. Пользователь выбирает тип → рендерится форма из его полей, сгруппированных по секциям.
3. Валидация обязательных полей на клиенте.
4. Submit → POST generate → blob → авто-скачивание `.docx`.
5. Состояния: loading (спиннер на кнопке), error (баннер с текстом ошибки бэкенда).
6. Адаптивная вёрстка (Tailwind grid, мобайл-первый).

## Модель данных

```ts
type FieldType = "text" | "textarea" | "date" | "number";
interface FieldDef { name: string; label: string; type: FieldType; required: boolean; group: string; }
interface TemplateDef { code: string; title: string; description: string; fields: FieldDef[]; }
interface GenerateRequest { templateCode: string; data: Record<string, string>; }
```

Дата-поле формы (`date`) на бэкенде раскладывается в `день_X` / `месяц_X` (слово) / `год_X`.

## Поток генерации (end-to-end)
1. Frontend POST `{ templateCode:"АОСР", data:{...} }`.
2. Backend: `validationService` → ok.
3. `templateService` находит `templates/АОСР.docx`, `pizzip` распаковывает.
4. `bookmarkFiller`: data + производные (раскладка дат) → правка `document.xml` по закладкам.
5. ZIP пересобирается → `output/АОСР_<номер>_<timestamp>.docx`.
6. Ответ: файл `.docx` (attachment). Frontend скачивает.

## Принципы
- Оригинальные шаблоны в `source/[Шаблоны]` — read-only; в работе используются копии в `backend/templates`.
- Форматирование docx не ломается (правится только текст внутри закладок).
- Никаких mock-данных — реальная генерация.
- Сложные функции оригинала (реестры, Power Query, авто-копирование вложений, PDF) — за рамками MVP, задокументированы как ограничения в QA_REPORT.
