# Iteration 004 — intelligence reliability

Implemented 14 October 2026 in the existing kailor repository. Work is uncommitted for review. No deployment, worktree, staging, commits, paid billing, artwork or frontend redesign occurred. The audited starting checkout was clean. The local Discovery file still contained Review your answers; that control was removed to honor the explicit request. Introduction, mascot assets, typography, cream composition, transitions and PDF template were preserved.

## Completed implementation

### Input quality and response semantics

`input-quality.ts` is the shared deterministic backend boundary for guided answers, chat candidates and legacy evidence. It returns stable disposition/issues, accepted, usableFacts, clarificationRequired, explanation and recovery. It rejects obvious empty/placeholder/repeated/keyboard/numeric-without-context content and instruction attempts. Short useful activity, uncommon proper nouns, technical terminology, Unicode and other languages are accepted conservatively. A valid activity alone does not establish a goal. Vague improvement, uncertainty, hypothetical/history-only statements and punctuation without context remain incomplete rather than reliable business facts. No numerical confidence probability was added.

Zod/catalogue validation remains. Rejected guided text returns structured HTTP 422 input_quality without confirmed evidence or revision advancement. The UI retains the entered text. Ambiguous saved descriptions ask for clarification. Chat history can persist without business evidence. Legacy meaningful-looking placeholders are excluded at reasoning time too.

Answers distinguish answered, unknown, not_applicable and skipped. Required text offers explicit uncertainty; required selections retain their existing constraints. Optional skipping does not mean no tools, no website or no budget. Unknown/not-applicable evidence does not become confirmed factual support. The plan additionally projects not_presented, awaiting_answer and irrelevant branches. Those describe planner lifecycle, not proof that a browser displayed a question.

### One sufficiency decision

`evidence-policy.ts` independently evaluates useful situation/objective facts, source-backed directions, material conflicts, unknowns and supported expertise. It does not import recommendation generation or count recommendations. `discovery-readiness.ts` wraps this policy; planner, assessment, conversation and Canvas use it. Confirmed current facets are applied before reasoning. Cases cannot supply absent user proof.

Preliminary readiness needs a useful situation, actual objective/problem, supported direction and no unresolved material conflict/unsupported specialist request. Optional financial details are not mandatory. Deeper readiness additionally requires useful scope, tools and constraints; saved uncertain strings cannot satisfy those gates. Neither status means implementation-ready or independently verified.

Planner version reliability-2 persists in_progress, clarification_required, preliminary_available, deeper_available, exhausted or unsupported with reasons and contextual recovery. A missing next question is never success by itself. Skipped/unknown questions are not endlessly repeated. A bounded catalogue clarification can be reopened through explicit Tell kailor more. The recovery composition acknowledges known facts, opens Conversation in the same session, or creates a fresh session while preserving old history.

### Corrections and conversation

`knowledge-conflicts.ts` handles current website/booking status and explicit AI/website/automation preferences with clause-level history/hypothetical distinctions. Incompatible guided input creates a pending proposal and returns HTTP 409 input_conflict with its ID and refreshed saved revision. Existing confirmed facts are retained. Explicit confirmation records resolved facets and revision; conflicting active evidence is retired with source history preserved. Compatible grouped corrections remain atomic; incompatible candidate batches are rejected. Closing a website preserves the simultaneous Instagram proposal. Budget/scope tension is explained as a tradeoff rather than automatically classified as contradiction.

Evidence provenance records source message ID/quote, basis, quality, conflicts, resolutions, confirmation revision and retirement reason. User confirmation is acceptance, not external verification. Local replies separately handle greetings, thanks, explanation requests, uncertainty and off-topic requests. Candidate facts remain pending. Current corrected facts and the saved authoritative plan reach conversational guidance, avoiding readiness disagreement with old raw prose. Multiple actual objectives are retained; price-only preferences do not overwrite the practical goal.

### Recommendations, reports and cases

Supported directions cite actual user fields and respect existing tools and explicit refusals. Existing booking software leads to improvement/integration. Industry alone cannot trigger a website. Invoice automation distinguishes demonstrated repetitive work from requested exploration. Exact application requests require scope; unfamiliar operational domains can receive conditional feasibility work with specialist review. Clinical diagnosis/prescribing requests are unsupported. Missing prices remain manual review, not fabricated cost figures.

Assessment checks readiness under the same revision lock before normal creation or idempotent reuse. Canvas uses a current eligible snapshot or validated preview; blocked sessions return no recommendation components. Reports remain immutable. Later changes or pending material conflicts make earlier reports stale; historical PDFs retain their original contents. Preparation stays in Discovery and Analysis navigation remains explicit.

Retrieval consumes validated current facts/states/evidence, excludes unsuitable constraints and declined technology, and cannot qualify on industry alone. Existing websites suppress pure new website/portfolio references. Seed unsuitable conditions remain limitations. Failed/insufficient simulations retain diagnostic sessions with null assessment/report and generate no reusable case. Valid runs generate pending synthetic patterns. Approval requires meaningful sanitized factors, known services and source readiness/snapshot support. Review versions and prior review audit data preserve edit history; source classification never becomes a real success through approval.

### Providers and diagnostics

Cloudflare REST, provider neutrality, local fallback, Zod, founder opt-in, server credentials, token/call bounds, reservations and guest forced-local behavior remain. Every provider additionally passes grounding/quality checks: text values/quotes must occur in user input, choice values must agree with local extraction, status quotes must support their value, and duplicate/conflicting proposals or filler replies fail validation. Existing timeout/rate-limit/budget recovery tests remain.

Sensitive-contact/identifier heuristics keep matching founder messages, saved answers and history local before remote reservation. This is limited screening, not complete DLP. Structured diagnostics use issue codes, counts, revision/completion and fallback reason rather than raw answer logging. Audit history retains mutation, correction, assessment and case-review events.

Observed local provider configuration was mock, remote disabled and Cloudflare credentials absent. No live inference was attempted, no paid billing enabled, and no claim of improved model accuracy is made.

## Baseline and final verification

Baseline: 78 unit tests, 31 PostgreSQL integration tests, all 14 persona evaluations and workspace typechecks passed.

Final executed results:

| Check                           | Actual result                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| npm test                        | 178 passed across 3 files                                                                    |
| npm run typecheck               | All 3 workspaces passed                                                                      |
| npm run build                   | Shared/backend/frontend passed; Vite production build succeeded                              |
| Isolated PostgreSQL integration | 100 passed across 2 files: original 31 plus 57 persisted matrix cases and 12 lifecycle cases |
| npm run evaluate                | 14 original personas and 57 reliability cases passed; zero reported failures                 |
| Migration/client generation     | Additive migration deployed to kailor and kailor_test; Prisma client regenerated             |
| git diff --check                | Passed                                                                                       |
| Live Cloudflare                 | Not run; credentials absent and remote disabled                                              |

One final integration invocation without localhost permission failed in suite setup; it ran no tests (100 skipped). The authorized localhost invocation then passed, and the final readiness/artifact changes were followed by another successful 100-test run. No database was reset. Isolated fixtures used disposable owners and cleaned their own records. Development simulations were not unnecessarily rerun.

The 57-case corpus includes filler, uncertainty, proper nouns/foreign language, activity-only input, invoices, booking/existing providers, corrections, refusal, hypotheses/history, multiple intents, unsupported specialist work, unclassified domains, greetings/off-topic/injection and response-state semantics. Unit assertions add provider malformed/empty/unsupported/conflicting output, grounding, timeouts, rate limits, budgets, retrieval constraints and fallback. API tests assert eligibility/report agreement, real recovery, pending/confirmed corrections, stale immutable PDFs, concurrent writes, pruning, restart history, failed-run approval safeguards, guest restrictions and sensitive founder local routing.

`npm run evaluate` writes ignored `.cache/qa/iteration004/acceptance-matrix.json`: initial context/input, expected/actual disposition, evidence, unknowns, readiness, assessment/recommendation permission, recovery, pass/fail and failure explanation. The PostgreSQL suite separately writes acceptance-api.json, including all execution statuses/failure details and completeness. The summary imports that file's timestamp/status; it does not pretend to run integration itself. All fixtures are synthetic assertions, not client outcomes or model accuracy percentages.

## Actual browser and PDF checks

Used the existing local 5173/5050 servers. Executed business selection → rejected Lorem ipsum with retained textarea → accepted nail activity → clarification/unknown/skips → exhausted recovery. Tell kailor more accepted the weekly manual invoices/several-hours description, made a qualified workflow direction available, retained explicit preparation/navigation and displayed source evidence without arbitrary AI/custom app/site directions.

The report reopened at its saved revision. Start again created a new session. A photography session with an existing website was handed to Conversation; Hi and a poem request yielded local relevant guidance without proposals. The closed-website/Instagram correction required grouped confirmation. The subsequent report showed Instagram, current website absence and historical source statements, not an active old website. Final screenshot: `.cache/qa/iteration004/current-corrected-report.png`.

The actual browser download succeeded: kailor-analysis-draft (1).pdf in Downloads. Its QA copy is `.cache/qa/iteration004/browser-report.pdf`. Two A4 pages were rendered and visually inspected: readable text, margins, pagination, evidence and qualified synthetic draft labels. Automated API tests additionally verify immutable report/PDF changes and blocked regeneration. Browser concurrency was not manually tested in two physical tabs; the actual competing revision behavior was exercised through PostgreSQL API tests. No formal comprehensive visual regression, mobile/browser compatibility, accessibility or live-model study was performed.

## Database and exact local commands

Migration `202610140002_intelligence_reliability` adds answer responseState/quality, evidence provenance, nullable simulation assessmentId and case reviewVersion. It backfills historical skipped and exact Not applicable values. No reports, existing secrets or founder password were changed. Apply the migration on other existing installations without reset/reseed.

From `/Users/keenosmith/Programming/kailor`:

```sh
npm run db:generate
npm run db:migrate
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run db:migrate
npm run dev
npm run typecheck
npm test
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
npm run evaluate
npm run build
git diff --check
```

The database URL above is the documented local test configuration. Use configured credentials elsewhere. Avoid a second npm run dev while 5173/5050 are occupied. Do not seed existing development data because seeding can update the founder password. No deployment or live provider setup is required for deterministic tests.

## Preserved functionality and remaining limits

PostgreSQL ownership, optimistic revisions/row locks, branch pruning, evidence history, audit events, immutable snapshots, PDF export, founder/guest separation, budgets and explicit case approval remain. Original tests and personas still pass. Frontend changes are confined to validation, readiness, confirmation, recovery, stale data and failed simulations.

The extraction/conflict rules are narrow and mostly English; other languages are accepted but not generally understood semantically. Free-form model reply claims do not receive complete claim-level verification. Sensitive screening is incomplete. No external business verification or URL fetching/audit exists. Clinical exclusions and capability classifications are conservative heuristics, not a general expertise ontology. Unsent text persists through transient submit failures, but not all cross-view/reload transitions. Chat turns can increment revision and stale reports even without new confirmed facts. Case review remains a single-consultant library, not tenant-isolated outcome learning. QA artifacts are ignored and local.

Iteration 005 priorities: a broader independently labelled language/correction corpus; authorized limited live-provider evaluation; stronger reply claim/privacy validation; explicit capability/feasibility boundaries and workflow-specific followups; founder case-review UX; revision-scoped drafts/question presentation telemetry; responsive/accessibility coverage. Evaluate retrieval vocabulary/embeddings only against measured failures. Fine tuning, deployment and a design overhaul remain separate work.

## Exact change manifest

Repository-relative paths below identify this iteration's changes. Generated Prisma/build/QA outputs are ignored.

```text
README.md
backend/package.json
backend/prisma/schema.prisma
backend/src/ai.ts
backend/src/app.ts
backend/src/assessment.ts
backend/src/context-extraction.ts
backend/src/discovery-planner.ts
backend/src/discovery-readiness.ts
backend/src/discovery.ts
backend/src/errors.ts
backend/src/library.ts
backend/src/session-service.ts
docs/api/API_REFERENCE.md
docs/architecture/ARCHITECTURE.md
docs/architecture/DATA_MODEL.md
docs/case-library/CASE_INTELLIGENCE.md
docs/deployment/LOCAL_SETUP.md
docs/discovery/DISCOVERY_ENGINE.md
docs/frontend/DESIGN_SYSTEM.md
docs/intelligence/INTELLIGENCE_DESIGN.md
docs/testing/TESTING_STRATEGY.md
frontend/src/Analysis.tsx
frontend/src/Canvas.tsx
frontend/src/Conversation.tsx
frontend/src/Discovery.tsx
frontend/src/SessionPage.tsx
frontend/src/Workspace.tsx
frontend/src/api.ts
frontend/src/types.ts
scripts/evaluate.ts
shared/src/index.ts
backend/prisma/migrations/202610140002_intelligence_reliability/
backend/src/answer-mutation.ts
backend/src/conversation-guidance.ts
backend/src/evidence-policy.ts
backend/src/input-quality.ts
backend/src/knowledge-conflicts.ts
backend/src/reliability-evaluation.ts
backend/src/session-state.ts
backend/tests/reliability.integration.test.ts
backend/tests/reliability.test.ts
data/evaluations/
docs/decisions/006-evidence-sufficiency-and-corrections.md
docs/iterations/004-intelligence-reliability.md
```
