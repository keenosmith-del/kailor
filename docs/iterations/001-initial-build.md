# Iteration 001 — initial working foundation

Date: 2026-10-13. Built exclusively in the existing kailor repository. No staging, commits, pushes, merges, worktrees or other Git writes were performed.

## Implemented

- npm workspaces for React/TypeScript/Vite frontend, Express/TypeScript backend and shared Zod contracts, with exact direct dependency pins and a lockfile.
- PostgreSQL Compose, Prisma 7.10.0 driver adapter/configuration, 17 relational models and two SQL migrations.
- Private admin authentication with scrypt, hashed revocable cookies, ownership checks, exact Origin validation, request/login limits, bounded bodies, centralized configuration/errors and structured logs.
- Version 1.0.0 discovery: four starting points, professional questions, single/multi/text inputs, optional skips, context branches, editing/pruning and backend persistence with row locking/revisions.
- Persistent ordered conversation, confirmed versus inferred evidence, explicit proposal confirmation and shared guided/chat answer updates.
- Provider-neutral interface, labelled keyless mock, opt-in Cloudflare REST adapter, structured output validation, timeout/429/error fallbacks and durable concurrent session/daily call allowances.
- Fifteen editable scenarios, thirteen classified services, five reusable synthetic personas and simulator using actual application services. All five regression runs passed and remain stored in the development database with pending review.
- Explainable approved-case retrieval and manual review with sanitized pattern editing; source classification survives approval. References refine discovery prompts and recommendation next-step checks without unlocking unsupported solutions.
- Evidence-gated conditional recommendations, alternatives, complexity/dependencies, delivery categories, manual-review estimates, live canvas, immutable revision reports and authenticated PDF export.
- Three vertical introductory scenes; responsive guided, conversation, canvas and seven-panel report views; configurable mascot states with understated reserved spaces; reduced-motion and keyboard controls.
- Product, architecture, data model, discovery, intelligence, case library, API, design, testing and setup documentation, Mermaid diagrams and four ADRs.

## Actual verification

| Check                                         | Result                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/domain/provider contract tests           | 37 passed                                                                                                                                                            |
| Actual PostgreSQL/Supertest integration tests | 17 passed                                                                                                                                                            |
| Synthetic CLI personas                        | 5 passed: nail technician, designer portfolio, invoice business, teacher preparation, kai proposal                                                                   |
| Workspace TypeScript checks                   | Passed                                                                                                                                                               |
| Shared/backend/frontend production builds     | Passed                                                                                                                                                               |
| Prisma client generation                      | Passed, Prisma 7.10.0                                                                                                                                                |
| Prisma schema validation                      | Passed                                                                                                                                                               |
| Development and isolated test DB migrations   | Both migrations applied successfully                                                                                                                                 |
| Prisma development migration status           | Up to date                                                                                                                                                           |
| npm audit after targeted overrides            | 0 known vulnerabilities at verification time                                                                                                                         |
| Browser inspection                            | Login, persisted sessions, prior-answer selected state, chat context, canvas and report panel navigation verified; desktop 1366px and mobile 390px layouts inspected |
| PDF                                           | Real PDF endpoint tested; sample pages rendered and visually inspected                                                                                               |
| Live Cloudflare inference                     | Not run; no credentials or paid usage enabled                                                                                                                        |
| Compiled API separate-port startup smoke      | Passed after resume: compiled server started on port 5051 and returned healthy PostgreSQL connectivity                                                               |

The development API and frontend were exercised together against PostgreSQL. Production bundles compiled successfully and the compiled API startup/health check passed after resuming. No deployment was performed. The initial separate-port smoke check was blocked when account usage prevented automatic approval review; the resumed approval succeeded. PostgreSQL had stopped during the pause and was restarted before checking health. Browser touch handlers exist but physical-device swipe behaviour was not tested. Browser inspection found a duplicated React peer dependency; root overrides plus Vite deduplication fixed the actual runtime error.

The initial Prisma diff command returned exit zero with an empty SQL output. Table verification caught this before reporting database success. A reviewed relational migration replaced the task-created empty migration record in the two otherwise empty databases; actual Prisma CRUD and integration tests then verified it. A follow-up migration gives messages explicit ordering.

Security overrides pin React/React DOM consistently and update Prisma's transitive deepmerge-ts/mysql2 dependencies. Generation, validation, migration status, tests and builds were verified with the overrides. The bundled PDF renderer initially emitted font-cache warnings; a project-local fontconfig cache was used for final rendering.

## Limitations and iteration 002 priorities

1. Exercise a credentialed Cloudflare model with consented test context and account-level spend limits. Add real input/output usage accounting and monetary budgets before enabling paid operation. Deeper analysis currently shares the conversation provider contract; assessments remain deterministic drafts.
2. Refine discovery rules, recommendation detail and scenario scoring through founder review. Only one definition version is implemented. Keep handlers for prior definitions when introducing a new version.
3. Add scoped consultant hours and pricing configuration. All current estimates correctly require manual review; vendor and recurring costs are unpriced. Service catalogue contains exploratory/partner/third-party categories, not established in-house claims for every service.
4. Add final mascot assets, formal accessibility checks, real-device swipe tests and PDF typography/art direction. PDFKit currently uses built-in Latin fonts; full Unicode font coverage is not implemented.
5. Design deployment, TLS, backups, observability, MFA/SSO and distributed throttling before exposing private records publicly. Customer/mobile authentication and tenant-isolated reference access are future work.
6. Add reviewed real-assessment/implementation case ingestion, retention/redaction policies and optional embeddings behind the retrieval interface. Only seeded and simulated ingestion currently ships.
7. Preserve unsubmitted drafts across view changes if desired. Submitted answers/history persist; unsent local form text does not.

No recurring kai publishing automation, CRM, marketplace, customer dashboard, payment processing, vector database or verified commercial results are included.

Startup commands and credential handling are in `docs/deployment/LOCAL_SETUP.md`; the complete route table is in `docs/api/API_REFERENCE.md`; actual directory structure is in the root README.
