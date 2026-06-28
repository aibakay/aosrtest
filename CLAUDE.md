# CLAUDE.md

## Project Goal

Create a full web replacement for the existing Excel/VBA document autogenerator.

The app must allow a user to:
1. open a website;
2. select document type;
3. enter data in forms;
4. generate a Word `.docx` file;
5. download the finished document.

This is not a mockup. The result must be a working fullstack application.

## Source

Put the source archive here:

`source/agenerator_5.26.06.22.zip`

It should contain:
- an Excel `.xlsm` autogenerator;
- a `[Шаблоны]` folder with Word `.docx` templates.

## Required Workflow

Work strictly in this order:

1. Unpack and inspect the archive.
2. Find the main `.xlsm` file.
3. Extract and analyze all VBA modules.
4. Find all Word templates.
5. Extract all Word bookmarks from templates.
6. Map frontend fields to backend fields and Word bookmarks.
7. Create `docs/ANALYSIS.md`.
8. Create `docs/ARCHITECTURE.md`.
9. Build backend.
10. Build frontend.
11. Connect frontend and backend.
12. Test document generation.
13. Fix all blocking errors.

Do not start coding before the analysis documents are created.

## Tech Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express
- TypeScript
- pizzip
- docxtemplater
- multer if file upload is needed

## Backend Requirements

Create backend in `/backend`.

Required endpoints:

- `GET /api/health`
- `GET /api/templates`
- `POST /api/documents/generate`

Backend must:
- receive JSON from frontend;
- validate input;
- select the correct Word template;
- fill template fields;
- generate `.docx`;
- save generated files to `/backend/output`;
- return `.docx` as downloadable file;
- provide clear error messages.

## Frontend Requirements

Create frontend in `/frontend`.

Frontend must include:
- document type selector;
- adaptive layout;
- form sections;
- required field validation;
- submit button;
- loading state;
- error state;
- `.docx` download.

Document types should be loaded from backend, not hardcoded if possible.

## Word Template Rules

Original templates must not be overwritten.

If templates use Word bookmarks:
- detect bookmarks;
- create a mapping layer;
- fill bookmarks correctly if possible.

If direct bookmark filling is unreliable:
- create converted working copies with placeholders;
- preserve original formatting;
- document the conversion process.

## Required Docs

Create:

`docs/ANALYSIS.md`
- found files;
- found templates;
- found VBA modules;
- found Word bookmarks;
- old generator logic;
- required frontend fields.

`docs/ARCHITECTURE.md`
- frontend architecture;
- backend architecture;
- API schema;
- data model;
- template generation flow.

`docs/TEMPLATES.md`
- all discovered Word templates;
- all bookmarks per template;
- field mapping strategy.

`docs/QA_REPORT.md`
- what was tested;
- what works;
- what failed;
- what was fixed;
- remaining limitations.

`docs/PROJECT_STATE.md`
- current short project context;
- completed steps;
- current blockers;
- next 3 actions.

## Definition of Done

Project is done only when:

1. backend starts;
2. frontend starts;
3. frontend connects to backend;
4. user can fill form;
5. backend generates `.docx`;
6. file downloads;
7. file opens in Microsoft Word;
8. template formatting is preserved;
9. README contains launch instructions;
10. QA report exists.

## Commands

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Token Saving Rules

Use the Context Compression / Token Saver skill throughout the whole project.

After every major stage:
1. update `docs/PROJECT_STATE.md`;
2. summarize what is done;
3. list only current blockers;
4. list the next 3 actions;
5. do not repeat old analysis unless it changed.

Before starting a new task:
1. read `docs/PROJECT_STATE.md` if it exists;
2. read only files directly related to the task;
3. do not reload or re-analyze the entire project unless necessary.

When responding:
- be brief;
- do not paste full files unless requested;
- report only changed files;
- avoid long explanations;
- prefer direct edits and tests.

## Important Rules

- Do not simplify the old logic without documenting it.
- Do not replace real generation with mock data.
- Do not break Word formatting.
- Do not overwrite original templates.
- Do not continue if generation does not work.
- Fix errors before moving forward.
- Keep code clean and modular.
