# Project State

## Current status
**ПРОЕКТ ЗАВЕРШЁН.** Все критерии Definition of Done выполнены.

## Completed
- Анализ архива, VBA (76 модулей), 13 шаблонов, все закладки.
- docs/ANALYSIS.md, ARCHITECTURE.md, TEMPLATES.md, QA_REPORT.md.
- **Backend** (Node+Express+TS, порт 3001):
  - GET /api/health ✅
  - GET /api/templates — 15 типов, поля из закладок ✅
  - POST /api/documents/generate — реальная генерация .docx ✅
  - bookmarkFiller + date-split (день/месяц-словом/год) ✅
- **Frontend** (React+TS+Vite+Tailwind, порт 5173):
  - Селектор 15 типов документов ✅
  - Динамическая форма из полей шаблона ✅
  - Секции: Объект / Стороны / Акт / Подписанты / Содержание / Параметры ✅
  - Валидация обязательных полей ✅
  - Скачивание .docx ✅
- **QA** ✅:
  - АОСР и АГИ протестированы end-to-end
  - Все закладки заполнены, форматирование сохранено
  - docs/QA_REPORT.md создан

## How to run
```bash
cd backend && npm install && npm run dev   # http://localhost:3001
cd frontend && npm install && npm run dev  # http://localhost:5173
```

## Deployment (Vercel)
Настроен единый Vercel-проект (ветка `claude/vercel-deployment-c0n94u`):
- `vercel.json` — статика фронтенда + serverless `/api` + `includeFiles` шаблонов.
- `api/index.ts` — реэкспорт Express-приложения.
- корневой `package.json` / `tsconfig.json` — зависимости и сборка функции.
- `server.ts` — `listen()` только при локальном запуске, иначе экспорт `app`.
- `templateService.ts` — устойчивый поиск папки шаблонов (cwd-fallback для Vercel).
- Локальная сборка фронта и `tsc --noEmit` бэка проходят.
- Деплой выполняется через Git-интеграцию Vercel (нет VERCEL_TOKEN в среде).

## Current blockers
Нет. Для запуска деплоя: импортировать репозиторий в Vercel (Root = корень).

## Next actions
1. Импортировать репозиторий в Vercel и сделать prod-деплой.
2. (Опц.) PDF-экспорт через серверный конвертер.
3. (Опц.) Сохранение черновиков (localStorage / БД).
