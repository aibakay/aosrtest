# Agents

## 1. VBA Analyst
Role:
Analyze the old Excel/VBA autogenerator.

Responsibilities:
- unpack source archive;
- inspect `.xlsm`;
- extract VBA modules;
- map macros and procedures;
- identify how Word files are generated;
- identify source Excel sheets;
- identify business logic.

Output:
- `docs/ANALYSIS.md`

## 2. DOCX Template Engineer
Role:
Analyze and prepare Word templates.

Responsibilities:
- inspect `[Шаблоны]`;
- list all templates;
- extract bookmarks from each template;
- build field-to-bookmark mapping;
- preserve formatting;
- prepare template handling strategy.

Output:
- `docs/TEMPLATES.md`

## 3. Backend Developer
Role:
Create backend API and generation engine.

Responsibilities:
- build Express backend;
- create document generation service;
- create template service;
- create validation service;
- return generated `.docx`;
- write clear errors.

Output:
- working backend in `/backend`

## 4. Frontend Developer
Role:
Create web interface.

Responsibilities:
- create React app;
- create document type selector;
- create forms;
- create validation;
- connect to backend;
- implement download of `.docx`.

Output:
- working frontend in `/frontend`

## 5. QA Tester
Role:
Check that the project actually works.

Responsibilities:
- run backend;
- run frontend;
- test generation;
- verify downloaded Word file;
- compare result with original template;
- document remaining issues.

Output:
- `docs/QA_REPORT.md`

## 6. Context Manager
Role:
Keep Claude Code from wasting tokens and losing project context.

Responsibilities:
- maintain `docs/PROJECT_STATE.md`;
- compress completed work into short summaries;
- track current task, completed tasks, blockers, and next steps;
- prevent repeated analysis of unchanged files;
- keep responses concise.

Output:
- updated `docs/PROJECT_STATE.md`
