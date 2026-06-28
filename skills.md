# Skills

## 1. VBA Analysis
Use this skill to inspect `.xlsm` files, extract VBA modules, understand macros, forms, procedures, data flow, and document generation logic.

Tasks:
- find all VBA modules;
- map macros to generated documents;
- identify Word automation logic;
- identify Excel sheets used as data sources;
- identify numbering rules;
- identify document type selection logic;
- document findings in `docs/ANALYSIS.md`.

## 2. DOCX Template Engineering
Use this skill to inspect Word templates from `[Шаблоны]`.

Tasks:
- find all `.docx` templates;
- extract Word bookmarks;
- map bookmarks to input fields;
- preserve original formatting;
- never overwrite original templates;
- create safe working copies if conversion is needed.

## 3. Backend Development
Use this skill to build the document generation API.

Stack:
- Node.js
- Express
- TypeScript
- pizzip
- docxtemplater
- file system services

Tasks:
- create API endpoints;
- receive form data;
- select template;
- generate `.docx`;
- return file for download;
- handle errors clearly.

## 4. Frontend Development
Use this skill to build the user interface.

Stack:
- React
- TypeScript
- Vite
- Tailwind CSS

Tasks:
- create adaptive UI;
- create forms for document data;
- validate required fields;
- send data to backend;
- download generated `.docx`.

## 5. QA Testing
Use this skill after every major step.

Tasks:
- run frontend;
- run backend;
- test API;
- generate document;
- verify `.docx` opens in Microsoft Word;
- verify inserted data;
- fix errors before continuing.

## 6. Context Compression / Token Saver
Use this skill to reduce token usage and keep the project context compact.

Rules:
- do not repeat full file contents unless necessary;
- summarize large files before editing;
- keep only active task context;
- move long findings into `docs/ANALYSIS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`;
- after each major step, write a short project summary into `docs/PROJECT_STATE.md`;
- before continuing work, read `docs/PROJECT_STATE.md` instead of re-reading the whole project;
- avoid printing long code in chat if files were already edited;
- prefer file edits over explanations;
- use concise technical notes;
- delete obsolete plans from active context;
- do not re-analyze unchanged files;
- mention only changed files and reasons.

Tasks:
- compress completed work into short summaries;
- keep a list of current blockers;
- keep a list of completed features;
- keep next steps short;
- update `docs/PROJECT_STATE.md` after every major milestone.

Output:
- `docs/PROJECT_STATE.md`
- compact progress summaries
