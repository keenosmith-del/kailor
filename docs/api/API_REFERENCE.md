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

## Guest discovery routes (introduced in iteration 002, public entry in iteration 009)

`POST /api/guest/sessions` accepts `{}` and creates a synthetic persisted preview. A separate 24-hour HttpOnly guest cookie identifies its restricted owner. The frontend uses `/preview/:id/:view`; it does not redirect into the founder login.

Under `/api/guest`, the following existing session operation shapes are available: `GET /sessions/:id`, `GET /sessions/:id/next`, `PUT /sessions/:id/answers`, `POST /sessions/:id/chat`, `POST /sessions/:id/evidence/:evidenceId`, `POST /sessions/:id/evidence`, `POST /sessions/:id/assessment`, `GET /sessions/:id/canvas`, `GET /sessions/:id/report`, and `GET /sessions/:id/report.pdf`. Each enforces guest ownership. No session listing, case review/retrieval, persona, simulation or admin endpoints are available through this router. Unknown preview routes return 404.

The same Origin and validation rules apply. Guest chat forces development/mock mode and references are seed-only. Cookie expiry returns 401 with a restart instruction. Guest routes work in production and with non-loopback API hosts; new production guest cookies are Secure and require HTTPS. Creation is capped at 20 per IP/hour in the current single-process server. Account credentials never authorize guest access; every session and plan lookup remains scoped to its guest owner.

Preparing an assessment returns data only; it does not mandate frontend navigation. Restarts create new sessions, leaving old reports intact. No registration endpoints were added.

## Adaptive plan and custom synthetic inputs (iteration 003)

`GET /sessions/:id/next` returns `revision`, `plannerVersion`, `question`, `active`, `context`, `readiness`, `ranking`, `referenceHints`, `suggestedPrompts` and `provenance`. Compatibility `answered`/`total` counts are metadata, not a progress percentage or completion condition. Question definitions can be deterministically adapted and are persisted. Readiness states: needs_information, preliminary, deeper, available_with_uncertainties, with canAssess/reasons/uncertainties.

A custom `{persona}` has id/name/description, `synthetic: true`, answers, chat, expectedServices and excludedServices. Strings/arrays, counts and overall HTTP body size are bounded. Every submitted answer still passes normal catalogue/branch/revision validation. Discovery paths for new runs are structured question/answer records; historical string-ID arrays remain historical data. Evaluation notes on reviewed runs contain JSON `{automated,review}`; older unreviewed records contain plain text. Verdict is acceptable, needs_revision or rejected, with notes ≥10 characters and bounded omissions/incorrectAssumptions arrays. Evaluation does not approve a case.

Website URL syntax validation accepts HTTP(S) without embedded credentials; no fetching/audit occurs. Assessment eligibility uses the qualitative readiness evaluator, with unknown optional inputs allowed. Model-authored questions, claim verification and binding quotations are not available.

## Iteration 004 mutation and recovery contracts

Answers additionally accept `responseState` (`answered`, `unknown`, `not_applicable`, `skipped`) and optional `resolveConflicts`. Explicit uncertainty is supported for required text, not a universal required-question skip. Zod and catalogue validation remain. Quality errors return HTTP 422 `input_quality` with `error.details.quality` (stable disposition/issues, explanation, usableFacts, recovery). Rejected text does not advance the session revision or create confirmed evidence.

A material guided contradiction returns HTTP 409 `input_conflict` with `error.details` containing quality, conflicts, pending evidence ID and the **new saved revision**. The pending proposal is persisted and old confirmed facts remain. Review it using the existing evidence endpoint, or explicitly resubmit the correction with resolveConflicts and the refreshed revision. This differs from stale `revision_conflict`, which requires reloading. Group confirmation rejects incompatible candidate batches and retains compatible corrections atomically.

Next-plan responses include completion, conflicts, answerStates and questionStates. Readiness additionally carries criticalUnknowns and evidenceDirections. Chat returns quality and pending source-grounded proposals; greetings/irrelevant text can remain history without facts. Context corrections identify current value, earlier keys and confirmation source. Canvas includes readiness and data source; blocked sessions have no recommendation components. Assessment HTTP 422 `insufficient_evidence` details explain current readiness/completion. Historical report/PDF retrieval remains available without overwriting the snapshot; its stale flag reflects current facts.

Failed synthetic runs can return null assessment/report and are not reusable. Review pattern `unsuitableConstraints` is optional. Case approval quality failures return 422 `case_quality`; revisions are tracked with prior review audit details. Founder/guest route restrictions are unchanged.

## Iteration 005 additions and semantics

- Session JSON includes `knowledgeRevision`; mutations continue to require the activity `revision`.
- `/sessions/:id/next` retains its shape and adds contextual statements/gaps, planned-question history and optional generation provenance. Optional question IDs use existing answer and evidence endpoints.
- Report `stale` compares knowledge revisions. `assessmentBlocked` separately indicates that current readiness prevents preparing a new assessment. Report content remains immutable and the PDF route still serves that saved content.
- `GET /api/simulations/:id` requires founder authentication and source-session ownership. It returns run detail plus `report`, the exact snapshot linked by the source run, or null.
- Existing case review accepts optional `reviewVersion`, `followUpDimensions`, bounded `approaches` and `unsuitableConditions`. Each approach specifies supported `serviceId`, `title`, `rationale`, optional `dependencies` and optional `unsuitableWhen` state keys. Stale supplied versions return `409 case_revision_conflict`; known identifying data at approval returns `422 case_sensitive_data`. Source classification cannot be edited.
- Model chat output may include `followUp {questionId,title,hint}` only for an explicitly requested current contextual text gap. It never directly changes confirmed answers.

All founder routes remain behind existing authentication/origin controls. Guest paths are unchanged and force local inference/seed-only references.

## Iteration 006 evidence edits and Conversation

The existing single-evidence POST accepts `{revision, accept, value?}` through shared strict `evidenceReviewInput`. Optional `value` is an edited string/string-array, validated for that evidence key by the existing answer writer. On acceptance it records user-edited confirmation provenance and retains the original proposal inactive. Both founder and guest routes enforce their existing ownership/origin/revision checks. Grouped confirmation is unchanged.

Chat response still returns `session`, `provider`, `fallbackReason` and quality. The frontend identifies local guidance and does not silently retry failed requests. Conversation uses existing assessment and report endpoints, with preparation and navigation as separate explicit actions. No new chat-readiness or summary endpoint was added. Activity revision remains the mutation concurrency token; confirmed material knowledge controls snapshot freshness.

## Iteration 007 plan and memory contracts

Founder paths below use `/api`; guest preview uses `/api/guest` with the existing guest cookie and local-preview restrictions. Every lookup is owner-scoped. Unknown/foreign IDs return 404. Invalid shapes return 400, stale revisions/selection return 409 and insufficient evidence remains 422. Existing session URLs, mutation payloads, assessment/PDF routes and immutable snapshots remain compatible.

| Method/path                                     | Input and behavior                                                                                                                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `GET /plans?archived=false&cursor=<uuid>`       | At most 30 plans plus `nextCursor`, bounded session metadata and `{activePlanId,revision}` selection. `archived=true` lists retained archived plans.                                                                           |
| `POST /plans`                                   | `{title,description?,creationKey}`; owner-scoped UUID request key prevents duplicate creation. Same key with different original content returns 409. Returns plan and first discovery identity.                                |
| `GET /plans/:id`                                | Plan metadata, including last selected session.                                                                                                                                                                                |
| `PATCH /plans/:id`                              | `{revision,title?,description?,archived?}`; optimistic lifecycle mutation. Archive clears that plan's active selection without selecting another plan.                                                                         |
| `POST /plans/:id/select`                        | `{revision,sessionId?}`; revision is the account **selection** revision from list, not plan/session revision. Membership is checked; persists last selected discovery and increments selection revision.                       |
| `GET /plans/:id/sessions?cursor=<uuid>`         | Twenty discovery metadata records per page.                                                                                                                                                                                    |
| `POST /plans/:id/sessions`                      | `{revision,creationKey}`; plan revision and stable UUID key. Starts a fresh discovery epoch and retains old history.                                                                                                           |
| `GET /plans/:id/understanding?sessionId=<uuid>` | Current confirmed facts, pending evidence, corrections, readiness, unknowns and valid summary version for the selected discovery. Does not generate a summary.                                                                 |
| `GET /plans/:id/reports?cursor=<uuid>`          | Twenty immutable report metadata records per page across this plan's discoveries.                                                                                                                                              |
| `GET /plans/:id/reports/:reportId`              | Exact owner-scoped historical snapshot.                                                                                                                                                                                        |
| `POST /plans/compare`                           | `{planIds:[uuid,uuid]}`; exactly two distinct owned plans. Returns labelled/minimized confirmed requirements and unknowns. No model call or evidence writes.                                                                   |
| `POST /sessions/:id/plan-proposals/:proposalId` | `{revision,decision:"create"                                                                                                                                                                                                   | "continue_current" | "cancel"}`; session revision. Atomic review; repeated same create returns its original plan. Does not confirm facts. |
| `GET /preferences`                              | Explicit account-default records with revision. Empty values are cleared revision tombstones.                                                                                                                                  |
| `PUT /preferences`                              | `{revision,key,value}`. Key `communicationStyle`: `plain-language`/`technical-detail`; key `implementationPreference`: `existing-tools-first`/`custom-when-justified`; `null` clears. Never accepts budgets or business facts. |

Model chat output optionally includes validated `intent` and grounded `planProposal {title,quote}`. They cannot execute actions. Chat response additionally exposes `intent` and `routing` (`application-action`, `authorized-model`, `local-fallback`); audit includes the same decision and safe fallback reason. Application-action message pairs remain visible history but are excluded from future model context. Pending plan proposals are included in session JSON. Session JSON adds planId and plan metadata. Existing evidence editing validates the edited option/type and returns a safe 400 for invalid values without changing state.

Archived sessions/reports remain readable. Answer/chat/evidence/assessment changes and new-session/selection actions require restoration. Memory refresh failure retains the successfully saved turn and uses bounded recent context; summaries are not authoritative evidence and have no client write endpoint.

## Iteration 008 accounts and conversation reset

`GET /auth/policy` returns `{registration: "closed"|"public"}`. `POST /auth/register` accepts strict `{email,password,name?,invite?}`; passwords remain 12–128 characters, and optional names are trimmed and limited to 2–150 characters. Public self-registration requires no invitation. The legacy `REGISTRATION_POLICY=invite` value also allows registration without a code; explicitly supplied legacy codes retain email-bound, expiry and atomic single-use checks. `closed` rejects registration. New accounts always receive member access and an HttpOnly session cookie. Login, registration and `GET /auth/me` return `{email,role,name}`; existing names may be null. Signup/login rate limits, generic registration errors and logout revocation remain. No GitHub OAuth endpoint exists in kailor.

`POST /auth/invites` is founder-only, accepts `{email}`, and returns a one-time code plus expiry duration; the code must be shared privately and is stored only as a hash. Founder-only middleware also protects cases/reviews, personas, scenarios and simulations. Other authenticated endpoints retain ownership checks; members receive 403 for founder operations, 404 for another owner's resources and 401 for missing/expired sessions.

`POST /sessions/:id/conversation/clear` accepts `{revision}` and returns the session. The guest counterpart is under `/guest`. It locks/checks ownership and revision, hides and excludes retained messages from future context, supersedes summaries and retires pending evidence/proposals. Confirmed answers, knowledge revision and reports are preserved. Stale revision returns 409. `hiddenFromTranscript` is included on message records so archived transcript data is distinguishable from active messages. New conversation uses existing `POST /plans/:id/sessions` with a stable creation key and plan revision.

## Project workspace additions (iteration 011)

The UI calls existing Plans projects; API names remain compatible. `POST /api/sessions/entry` accepts an empty object and requires an account cookie plus exact Origin. Under an owner lock it resumes the selected active conversation, falls back to recent work, or creates the first project/session. Existing `POST /api/sessions` retains its fresh-session behavior.

`POST /api/guest/sessions` now resumes the guest's active temporary project under the same lock. Guest project creation (including accepting a new-project proposal) returns 409 when a project already exists. Existing records are preserved.

`POST /api/plans/:id/sessions` accepts optional `carryContext: boolean` alongside required `revision` and `creationKey`. Default false preserves compatibility; true copies guided answers and active confirmed evidence from the project's last selected session, with inherited provenance. It does not copy pending evidence or transcripts.

`GET /api/plans/:id/reports/:reportId/pdf` downloads that immutable snapshot, verifying owner and matching project. The corresponding allowlisted guest route is `/api/guest/plans/:id/reports/:reportId/pdf`. Existing JSON report history and latest-session PDF endpoints are unchanged. No file ingestion or guest transfer endpoint is introduced.

## Solution canvas and consultancy intake (iteration 018)

`GET /sessions/:id/canvas` now additionally returns `solutions: Solution[]` (see `shared/src/solutions.ts`). Legacy graph/components/consulting fields remain compatible. Solutions expose stable IDs, a deterministic scope fingerprint (`revision`), category visual, provenance, capabilities, facts, constraints, selection/review state and, when present, a real saved request reference. The scope fingerprint is not a concurrency or authorisation token; mutations also validate project/session revisions and ownership.

`PUT /plans/:id/canvas` retains its `{revision,state}` contract. `state.edits[id]` additionally accepts `capabilities?: {id:UUID,label:string,priority:essential|optional|deferred|unconfirmed}[]` (maximum 30). Optional `state.selections` is a bounded map from stable solution ID to `{selected:boolean,basisRevision:nonnegative integer,updatedAt:ISO datetime}`. Old states remain valid. Selections do not commission work.

| Method and path                                     | Contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /sessions/:id/solutions/:solutionId/reasoning` | Owned current-context PDF attachment. 404 for an unavailable solution or foreign session. Identifies current revisions; does not rewrite or replace a historical report.                                                                                                                                                                                                                                                                                                  |
| `POST /plans/:id/consultancy-requests`              | Account required. Strict body `{sessionId:UUID,requestKey:UUID,projectRevision:number,solutions:[{id,revision}],notes:string}`. 1–30 unique solutions; notes ≤3000 characters. Every solution must belong to the owned current project, be explicitly selected and reconciled. Server reconstructs scope and persists `pending`. 201 `{id,status,createdAt}`; same accepted key returns its receipt; stale/review-required/missing scope returns 409. Guests receive 401. |
| `GET /plans/:id/consultancy-requests`               | Owner-only latest 30 submitted requests, including immutable scope and notes.                                                                                                                                                                                                                                                                                                                                                                                             |
| `GET /consultancy-requests?cursor=UUID`             | Admin-only inbox. Up to 30 requests, associated project title and account name/email, plus `nextCursor`. Used by the existing `/founder` UI. Members/guests receive 403.                                                                                                                                                                                                                                                                                                  |

The owned canvas, reasoning, selection and project request-read routes also exist below `/api/guest` under the established guest cookie. Submission under that prefix still requires transfer to an account and never accepts a guest principal. No quotation, scheduling, payment, commissioning or progress endpoint is implemented by this iteration.

### Current-solution Chat context

Session Chat requests accept optional `solutionId` alongside `revision`, `message` and `mode`. The ID must identify a solution in the session's current, owned project; missing or foreign records return 404 before provider inference. The current category, objective, capability priorities, refinements and reasoning are loaded from the same reconciled projection used by Canvas. Optional `reportId` continues to select an immutable historical assessment explicitly; it does not rewrite that snapshot. Canvas responses also include the reconciled current `recommendations` projection. No additional persisted knowledge model is introduced.
