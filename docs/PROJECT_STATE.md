# Project State

## Current status
**ПРОЕКТ ЗАВЕРШЁН + добавлена функция «Приказы и распоряжения».**
Все критерии Definition of Done выполнены.

## Функция «Приказы и распоряжения» (новое)
Справочник приказов/распоряжений на ответственных лиц + автоподбор по дате
окончания работ при генерации ИД.
- **Backend**: сущность `OrderDirective`, репозиторий `OrderDirectiveRepository`
  (JSON `backend/data/order-directives.json`, легко заменить на SQL), сервис с
  CRUD + правилом автоподбора, роуты:
  - `GET /api/order-directives` ✅
  - `GET /api/order-directives/active?date=YYYY-MM-DD` ✅
  - `POST /api/order-directives` ✅
  - `PUT /api/order-directives/:id` ✅
  - `DELETE /api/order-directives/:id` (soft-deactivate, `?hard=true` — удаление) ✅
  - mapping-слой `config/orderDirectiveMapping.ts` (роль → ключи Word, аддитивно) ✅
- **Frontend**: мини-роутер (History API, без новых зависимостей), страница
  `/order-directives` (таблица, фильтры: тип/роль/организация/активность/дата,
  поиск по номеру/ФИО/должности/организации, добавление/редактирование/деактивация),
  блок «Приказы и распоряжения» в форме генерации с автоподбором по
  `Дата_оконч_picker` и ручной заменой ✅
- **Проверено** (API + генерация): CRUD, валидация, автоподбор по дате (включая
  пустой `validTo` = бессрочно и истёкший период), множественные совпадения с
  предупреждением, генерация .docx с приказами и без них — оба валидны ✅
- **Ограничение**: в текущих Word-шаблонах нет выделенных закладок под приказы —
  значения мапятся в аддитивные ключи и попадут в документ после добавления
  соответствующей закладки в шаблон (см. `docs/TEMPLATES.md`).

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

## Функция «Авто-реестр документов, подтверждающих качество» (п.5)

Условная логика: если поле приложений (`приложения` / `Приложения` / `Приложения_АООК`) содержит >5 строк:
- В акте (`приложения`/`Приложения`/`Приложения_АООК`) проставляется ссылка «Согласно реестру документов, подтверждающих качество (прилагается)».
- Генерируется отдельный .docx-реестр: заголовок, ссылка на акт, таблица «№ / Наименование документа / Примечание».
- Оба файла упаковываются в ZIP (`Пакет_документов_<ts>.zip`) и возвращаются за один запрос.
- Фронтенд определяет ZIP по `Content-Type: application/zip`, сохраняет с правильным именем, показывает синее уведомление на 8 с.

**Файлы:**
- `backend/src/services/qualityRegistryService.ts` — парсинг приложений + генерация реестра .docx (без файла-шаблона, XML в коде) ✅
- `backend/src/services/generatorService.ts` — логика >5, ZIP-бандл ✅
- `backend/src/routes/documents.ts` — ZIP-ответ при наличии реестра ✅
- `frontend/src/api/client.ts` — `GenerateResult {blob, fileName, isBundle}` ✅
- `frontend/src/components/DocumentForm.tsx` — уведомление при isBundle ✅

## Функция «Нумерация приложений» (п.6) ✅

- **Frontend**: новый тип поля `"attachments"` — компонент `AttachmentsListField` со списком строк (добавить / удалить / перетащить стрелками). Данные хранятся как `\n`-разделённая строка в `values`, совместимо с API и localStorage-черновиками.
- **Backend**: `generatorService.ts` — перед `fillBookmarks` добавляет нумерацию `1. … 2. …` (если ≤5 строк). `bookmarkFiller.ts` — поддержка `\n` → `<w:br/>` внутри Word-рана.
- **Согласование с п.5**: `parseAttachments` вызывается до нумерации и strips existing numbers, так что счётчик >5 работает корректно; если >5 → реестр, иначе → нумерованный список в закладке.
- **Изменённые файлы**: `types.ts` (фронт+бэк), `config/templates.ts`, `AttachmentsListField.tsx` (новый), `FormField.tsx`, `DocumentForm.tsx`, `bookmarkFiller.ts`, `generatorService.ts`.

## Current blockers
Нет.

## Next actions
1. При необходимости добавить шаблон реестра из файла (`.docx`) вместо XML-генерации в коде.
2. Добавить PDF-экспорт (LibreOffice на сервере).
3. Расширить FIELD_META метаданными для новых типов документов.
