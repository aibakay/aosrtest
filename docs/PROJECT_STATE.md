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

## Deployment (Vercel — два отдельных проекта)
Ветка `claude/vercel-deployment-c0n94u`:
- **Backend** (Root = `backend`): `backend/api/index.ts` (реэкспорт app),
  `backend/vercel.json` (rewrite `/api/*` → функция, `includeFiles: templates/**`).
- **Frontend** (Root = `frontend`): Vite, `frontend/vercel.json` (SPA),
  адрес API задаётся env `VITE_API_URL = https://<backend>.vercel.app/api`.
- `server.ts` — `listen()` только локально, иначе экспорт `app`.
- `templateService.ts` — устойчивый поиск папки шаблонов (cwd-fallback).
- CORS на бэкенде включён (кросс-доменные запросы фронта).
- Локальная сборка фронта и `tsc --noEmit` бэка проходят.

## Current blockers
Для реального деплоя нужен `VERCEL_TOKEN` (в среде агента CLI/токена нет)
либо ручной импорт двух проектов в дашборде Vercel.

## Next actions
1. Задеплоить два проекта (через токен или импорт в дашборде).
2. Прописать `VITE_API_URL` фронтенду = домен бэкенда + `/api`.
3. (Опц.) PDF-экспорт / сохранение черновиков.
