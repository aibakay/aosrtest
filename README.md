# Автогенератор ИД — веб-версия

Веб-замена Excel/VBA-автогенератора исполнительной документации.  
Поддерживает 15 типов документов: АОСР, АООК, АОУСИТО, АРООКС, АОГРОКС, АВК, АГИ, АИИО, АПрОб, ОтЭфД, Пролив, Промывка и др.

## Запуск

### Backend
```bash
cd backend
npm install
npm run dev
# запускается на http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# запускается на http://localhost:5173
```

Открой браузер: **http://localhost:5173**

## Деплой на Vercel (два отдельных проекта)

Разворачивается как **два независимых Vercel-проекта**: бэкенд (serverless API)
и фронтенд (статика). У каждого свой Root Directory и свой `vercel.json`.

### 1. Backend (Root Directory = `backend`)
- `backend/api/index.ts` — точка входа serverless-функции (реэкспорт Express-приложения).
- `backend/vercel.json` — маршрут `/api/*` → функция, шаблоны подключены через `includeFiles`.
- Зависимости берутся из `backend/package.json`.

Импорт: **Add New → Project** → выбрать репозиторий → **Root Directory: `backend`**
→ Framework Preset: **Other** → Deploy.
Получишь домен вида `https://<backend>.vercel.app` с API на `/api/*`.

### 2. Frontend (Root Directory = `frontend`)
- `frontend/vercel.json` — SPA-rewrites.
- Framework определяется автоматически как **Vite**.

Импорт: ещё один проект из того же репозитория → **Root Directory: `frontend`**
→ в **Environment Variables** задать
`VITE_API_URL = https://<backend>.vercel.app/api` → Deploy.

Фронтенд по умолчанию ходит на `/api`; так как бэкенд на другом домене, нужно
указать `VITE_API_URL`. CORS на бэкенде включён, кросс-доменные запросы работают.

### Через CLI
```bash
npm i -g vercel
cd backend  && vercel --prod   # деплой бэкенда
cd frontend && vercel --prod   # деплой фронтенда (с VITE_API_URL в env проекта)
```

> На Vercel файловая система только для чтения, поэтому сгенерированные
> `.docx` не сохраняются в `output/`, а сразу отдаются в ответе на скачивание.

## Использование

1. Выбери тип документа в сетке сверху.
2. Заполни поля формы (обязательные отмечены `*`).
3. Нажми «Сформировать документ».
4. Файл `.docx` скачается автоматически.

## API

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/health` | Проверка работоспособности |
| GET | `/api/templates` | Список шаблонов с полями |
| POST | `/api/documents/generate` | Генерация `.docx` |

Тело запроса `/api/documents/generate`:
```json
{
  "templateCode": "АОСР",
  "data": {
    "Наименование_объекта": "...",
    "Номер_акта": "1",
    "Дата_акта_picker": "2026-06-28",
    ...
  }
}
```

## Структура проекта

```
backend/
  src/
    server.ts              — Express точка входа
    routes/                — health, templates, documents
    services/
      templateService.ts   — загрузка шаблонов, извлечение закладок
      bookmarkFiller.ts    — заполнение Word-закладок в document.xml
      generatorService.ts  — генерация .docx (pizzip)
      validationService.ts — валидация обязательных полей
    config/templates.ts    — метаданные полей (label, type, group)
  templates/               — рабочие копии Word-шаблонов
  output/                  — сгенерированные файлы

frontend/
  src/
    api/client.ts          — fetch к backend
    components/
      TemplateSelector.tsx  — выбор типа документа
      DocumentForm.tsx      — динамическая форма
      FormField.tsx         — отдельное поле
    App.tsx

source/                    — оригинальный архив (read-only)
docs/                      — анализ, архитектура, QA
```

## Технологии

- **Backend**: Node.js, Express, TypeScript, pizzip (docx как zip)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Генерация**: прямая правка `word/document.xml` (заполнение Word Bookmarks)

## Ограничения (вне MVP)
- Автоматические реестры приложений (Excel Power Query) — вводятся вручную текстом.
- PDF-экспорт — не реализован.
- Копирование вложенных файлов (схем, протоколов) — не реализовано.
