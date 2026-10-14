# REST API

Base URL: `http://127.0.0.1:5050/api`. JSON requests use `Content-Type: application/json`. All business routes require the admin cookie. Except GET/HEAD/OPTIONS, requests must include the exact `Origin` configured in `.env` (default `http://127.0.0.1:5173`). The frontend proxy supplies a same-origin experience. No permissive CORS or bearer-token bypass exists.

Errors: `{ "error": { "code": "revision_conflict", "message": "...", "requestId": "..." } }`. Validation errors may include field `issues`. Rate-limit middleware returns the same code/message envelope without a request ID. Expected statuses: 400 invalid request/answer, 401 unauthenticated, 403 origin, 404 absent/inaccessible entity, 409 revision/definition conflict, 422 insufficient evidence, 429 request limit, 500 sanitized internal failure. Bodies are bounded to 32KB.

| Method | Path                                 | Behaviour/input                                                                                      |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| GET    | `/health`                            | Public DB connectivity and definition version                                                        |
| POST   | `/auth/login`                        | `{email,password}`; HttpOnly cookie, eight-hour expiry                                               |
| GET    | `/auth/me`                           | Current admin email                                                                                  |
| POST   | `/auth/logout`                       | Revokes cookie token; 204                                                                            |
| GET    | `/discovery`                         | Version and question definitions                                                                     |
| GET    | `/sessions`                          | Latest 50 sessions owned by admin                                                                    |
| POST   | `/sessions`                          | `{name}`; creates ordinary private session                                                           |
| GET    | `/sessions/:id`                      | Subject, revision, answers, active evidence and ordered messages                                     |
| PUT    | `/sessions/:id/answers`              | `{revision,questionId,value,skip?}`; validated upsert/pruning                                        |
| GET    | `/sessions/:id/next`                 | Persisted adaptive plan, active definitions, ranking reasons, context, readiness and reference hints |
| POST   | `/sessions/:id/chat`                 | `{revision,message,mode?}`; mode conversation/analysis; session/provider/fallbackReason              |
| POST   | `/sessions/:id/evidence/:evidenceId` | `{revision,accept}`; explicit confirmation/dismissal                                                 |
| POST   | `/sessions/:id/evidence`             | `{revision,ids,accept}`; atomic group review of 1–8 unique pending evidence UUIDs                    |
| POST   | `/sessions/:id/assessment`           | `{revision}`; assessment ID, report ID, snapshot content                                             |
| GET    | `/sessions/:id/canvas`               | Current existing/core/optional/future components with dependencies                                   |
| GET    | `/sessions/:id/report`               | Latest immutable snapshot and stale flag                                                             |
| GET    | `/sessions/:id/report.pdf`           | Latest stored snapshot as authenticated PDF attachment                                               |
| GET    | `/scenarios`                         | Fifteen stored templates                                                                             |
| GET    | `/personas`                          | Fourteen synthetic persona definitions                                                               |
| POST   | `/simulations`                       | `{personaId}` or `{persona}`; persisted local-only run, report and behavioral result                 |
| GET    | `/simulations`                       | Latest 50 runs belonging to the admin                                                                |
| PUT    | `/simulations/:id/evaluation`        | `{notes,omissions,incorrectAssumptions,verdict}`; owner-scoped founder evaluation                    |
| GET    | `/cases`                             | Private review library, including pending/rejected records                                           |
| GET    | `/cases?sessionId=UUID`              | Approved matches with scores and explanations                                                        |
| PUT    | `/cases/:id/review`                  | `{status,notes,title,pattern}`; status approved/rejected; notes ≥10 chars                            |

Answer values are strings (up to 4000 characters) or arrays (up to 20 option strings). Single/multi selections must use definition option IDs. Multi-selection `none` is exclusive. Required answers cannot be skipped. An irrelevant branch question is rejected. Chat text is limited to 4000 characters.

Review patterns are validated objects with `industry`, `problems`, `tools`, `goals`, `patterns`, optional `discoveryQuestions`, `constraints`, `stage`, `scope` and `limitations`. Edit out identifying details before approving. Source type is never writable through review.

Example of a first answer, after session creation:

```json
{ "revision": 0, "questionId": "stage", "value": "established" }
```

Every successful answer/chat/confirmation mutation returns or contains the refreshed session revision. Use that revision for the next mutation. A 409 requires reload; do not blindly retry a stale write. Assessment creation is idempotent for the same revision and does not increment it. Subsequent edits preserve old reports and make them stale. PDF exports the latest stored report even when stale, with its original revision/date; regenerate explicitly if current answers should be reflected.

Sessions accept no client-supplied synthetic flag. The internal simulator creates synthetic sessions deliberately. Cases are a single-consultant library; tenant-isolated case review is not implemented.

## Local guest preview routes (iteration 002)

`POST /api/guest/sessions` accepts `{}` and creates a synthetic persisted preview. A separate 24-hour HttpOnly guest cookie identifies its restricted owner. The frontend uses `/preview/:id/:view`; it does not redirect into the founder login.

Under `/api/guest`, the following existing session operation shapes are available: `GET /sessions/:id`, `GET /sessions/:id/next`, `PUT /sessions/:id/answers`, `POST /sessions/:id/chat`, `POST /sessions/:id/evidence/:evidenceId`, `POST /sessions/:id/evidence`, `POST /sessions/:id/assessment`, `GET /sessions/:id/canvas`, `GET /sessions/:id/report`, and `GET /sessions/:id/report.pdf`. Each enforces guest ownership. No session listing, case review/retrieval, persona, simulation or admin endpoints are available through this router. Unknown preview routes return 404.

The same Origin and validation rules apply. Guest chat forces development/mock mode and references are seed-only. Cookie expiry returns 401 with a restart instruction. Production mode or a configured API host outside localhost/127.0.0.1/::1 returns 404 for all preview operations. Preview creation is capped at 20 per IP/hour in the current single-process local server.

Preparing an assessment returns data only; it does not mandate frontend navigation. Restarts create new sessions, leaving old reports intact. No registration endpoints were added.

## Adaptive plan and custom synthetic inputs (iteration 003)

`GET /sessions/:id/next` returns `revision`, `plannerVersion`, `question`, `active`, `context`, `readiness`, `ranking`, `referenceHints`, `suggestedPrompts` and `provenance`. Compatibility `answered`/`total` counts are metadata, not a progress percentage or completion condition. Question definitions can be deterministically adapted and are persisted. Readiness states: needs_information, preliminary, deeper, available_with_uncertainties, with canAssess/reasons/uncertainties.

A custom `{persona}` has id/name/description, `synthetic: true`, answers, chat, expectedServices and excludedServices. Strings/arrays, counts and overall HTTP body size are bounded. Every submitted answer still passes normal catalogue/branch/revision validation. Discovery paths for new runs are structured question/answer records; historical string-ID arrays remain historical data. Evaluation notes on reviewed runs contain JSON `{automated,review}`; older unreviewed records contain plain text. Verdict is acceptable, needs_revision or rejected, with notes ≥10 characters and bounded omissions/incorrectAssumptions arrays. Evaluation does not approve a case.

Website URL syntax validation accepts HTTP(S) without embedded credentials; no fetching/audit occurs. Assessment eligibility uses the qualitative readiness evaluator, with unknown optional inputs allowed. Model-authored questions, claim verification and binding quotations are not available.
