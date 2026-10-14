# Iteration 003 — adaptive discovery and curated intelligence

Implemented 14 October 2026 in the existing modular monolith. Changes remain uncommitted. The pre-existing `frontend/src/Intro.tsx` edit was preserved. No artwork, deployment, registration, publication, billing activation, microservices, vector store or model training was introduced.

## Baseline and preserved boundaries

The audited baseline passed 40 unit tests and all workspace TypeScript checks. Production discovery formerly selected the first applicable unanswered catalogue item; mock conversation understood only `set field: value`; assessment required industry, problems and goals regardless of the user's actual description.

Session ownership, PostgreSQL row locks, concurrent revision conflicts, conditional branch pruning, inactive evidence history, explicit confirmation, assessment idempotency and immutable report snapshots remain. The three introduction scenes, cream palette, mascot assets, transitions, separate Canvas, seven Analysis sections and PDFKit generator were retained. Founder/guest cookies and production guest restrictions remain distinct. Guests receive seed-only references and forced local inference; simulations also force local inference.

## Architecture

```mermaid
flowchart TD
  Guided[Guided answers] --> Mutation[Revision-locked session mutation]
  Chat[Conversation] --> Gate[Founder opt-in / reservation / timeout]
  Gate --> Extract[Cloudflare or narrow local extraction]
  Extract --> Pending[Pending evidence: confirm or dismiss]
  Pending --> Mutation
  Mutation --> Context[Confirmed facts + source-linked possibilities + unknowns]
  Context --> Rank[Question relevance and decision impact]
  Approved[Approved reusable cases / guest seeds only] --> Rank
  Rank --> Plan[Persisted contextState + planState at session revision]
  Context --> Recommend[Evidence-grounded catalogue directions and alternatives]
  Recommend --> Readiness[Situation + objective + defensible direction]
  Readiness --> Plan
  Plan --> UI[Shared guided and conversational UI]
  UI --> Explicit[Explicit preparation and Explore the analysis]
  Explicit --> Snapshot[Immutable assessment/report]
  Snapshot --> PDF[Existing PDF export]
```

`context-extraction.ts` owns narrow language extraction and the normalized projection. `discovery-planner.ts` ranks and adapts catalogue questions. `discovery-readiness.ts` evaluates readiness. Existing assessment and retrieval modules reason from the same saved answers. Provider implementations never mutate database facts. There is no separate chat knowledge store.

## Context and provenance

The projection stores subject kind/stage/activity, confirmed facts with evidence IDs, confirmed preferences, objectives, workflows, requirements, source-linked rule possibilities, pending proposals, missing inputs, potential directions and a specialist-review flag. Fields may be absent; free-form descriptions are retained. Domain names need not match a seed.

A guided submission or explicit proposal acceptance creates confirmed evidence. Standardized signals extracted from confirmed prose are **rule-inferred possibilities**, not new confirmed fields. They may select a relevant question or conditional direction; recommendations cite the actual saved description. Explicit selected answers, including `none` and skipped fields, win over these signals. Pruning excludes dependent descriptions from its trigger calculation, preventing a stale branch from activating itself.

All conversational candidates remain `inferred` pending explicit confirmation, whether produced by local rules or a model. Provider identity is saved as the source; confirmation saves `chat-confirmed`. Dismissed exact key/value proposals stay in inactive rejected history and are suppressed on repetition. New materially different values can be proposed. One active pending value per field prevents contradictory batch updates. Branch edits retire irrelevant pending evidence. Group confirmation uses the existing answer writer inside one transaction; each accepted field advances the revision.

The system does not independently verify self-reported business facts. It has no claim-level external verification engine. Local extraction deliberately handles limited patterns and rejects obvious hypothetical phrasing; it is not a general language model.

## Question lifecycle and ranking

Definition `1.0.0` and its established IDs remain compatible. Optional `scopeDetails`, `workflowDetails`, `websiteUrl` and `websiteStatus` extend the catalogue. The old order-based `nextQuestion` helper remains for historical catalogue tests; API discovery and persisted simulation runs use the adaptive planner.

Ranking is a priority rubric, not a probability or information-theoretic estimate:

| Gap                                        | Priority | Purpose                                                |
| ------------------------------------------ | -------: | ------------------------------------------------------ |
| Starting context                           |     1000 | Choose a pathway                                       |
| Exact request, new idea or vague situation |      900 | Describe the real starting point first                 |
| Missing activity                           |      800 | Establish context                                      |
| Application scope                          |      780 | Users, features, review, data and alternatives         |
| Relevant workflow details                  |      700 | Distinguish manual improvements, tools and engineering |
| Missing practical outcome                  |      680 | Identify intended value                                |
| Constraints                                |      650 | Avoid disproportionate solutions                       |
| Unidentified friction                      |      590 | Avoid industry assumptions                             |
| Existing tools                             |      550 | Avoid replacing useful technology                      |
| Presence, when presentation is relevant    |      520 | Check before proposing a website                       |
| Optional supplied URL                      |      300 | Syntax evidence only                                   |
| Voluntary investment range                 |      100 | Optional commercial input                              |

An indirectly described field is removed from the candidate ranking. Already answered/skipped IDs cannot repeat. Approved relevant cases add a small +10 workflow-check priority and supply separately labelled reference hints. Stable ID ordering resolves ties. Once preliminary assessment is defensible, low-impact optional questions do not prolong discovery. Optional commercial fields remain accessible through answer review/conversation.

The plan saves complete question definitions, ranking reasons, source/version, case IDs, prompts, readiness and context at the current revision. Repeated reads return the same plan. New answers, chat turns and confirmation rebuild it transactionally. Legacy sessions with null projections initialize lazily on the next-plan request. Approved-case changes do not rewrite an already saved revision plan; a subsequent meaningful mutation refreshes references. Domain adaptations currently use deterministic templates, including teacher review/template scope and unfamiliar workflow investigation. AI-authored question generation is not implemented. Persisted simulation paths additionally capture actual question titles, values, skips, revisions and source; this is not a full historical event-sourced replay of every interactive UI state.

## Readiness

A preliminary assessment requires a described situation, at least one practical objective/requirement/problem, and at least one defensible catalogue direction. Optional constraints, investment, tools or timing can be explicitly unknown. States are `needs_information`, `preliminary`, `deeper`, and `available_with_uncertainties`; reasons and uncertainties are persisted. Deeper readiness additionally requires useful scope/workflow detail and specified optional inputs. This is a conservative qualitative rubric, not a claim that a project is implementation-ready.

The assessment endpoint uses this evaluator instead of requiring three fixed fields. The frontend allows preparation while a material follow-up remains. Preparation does not navigate: **Explore the analysis** is an explicit action. Later revisions mark earlier snapshots stale without mutating them.

## Conversation and Cloudflare

Natural local phrases can propose activity, existing channels/tools, goals, constrained budget/preferences, booking/invoice/content problems and application requests. "No website" is recorded as website absence, not as an assertion that no other online channels exist. Grouped and individual confirmation are available. Guided and conversational views use the same backend plan and saved answers. Suggested prompts contain normal language, not development commands. Legacy command syntax remains for compatibility tests only.

Cloudflare retains its provider-neutral REST adapter. Its prompt now includes catalogue capabilities, validated choice IDs, current confirmed answers and the adaptive question/readiness. It requests concise structured extraction and alternatives, treats supplied text as untrusted data, and forbids privileged actions or unsupported capability claims. Zod plus question validation applies to **every** provider; duplicate proposal keys are rejected. Invalid JSON, invalid fields/options, network failures, timeouts and rate limits fall back without retries.

Guided clicks never invoke a model. Only explicit founder chat/alternative requests can reserve remote usage, and only when provider, opt-in and credentials are all configured. Advisory-lock budget reservations, token limits, failed-attempt accounting, server-side secrets and guest forced-local routing remain intact. No paid plan was activated. Call ceilings are not a monetary or free-tier billing guarantee; future paid routing still needs account limits, tariffs and actual usage reconciliation.

Observed configuration: provider `mock`, remote opt-in `false`, Cloudflare credentials absent. **Live inference was not run and remains unverified.** HTTP contract, validation, timeout, rate-limit and safe-fallback tests use controlled mocks. Model hallucinations remain possible; confirmation is the authoritative boundary, and there is no model-generated independently verified evidence.

## Retrieval and curated learning

Approved references match actual problems (+4), tools/channels (+2), goals (+2), scope (+3), project stage (+2), constraints (+1) and industry (+1). A match must include a problem, goal or scope factor; channels or industry alone cannot qualify. Return up to four deterministic results with source, approval status, matching reasons, usefulness and limitations. Rule-derived challenge factors are labelled as described signals requiring interpretation review, not confirmed standardized facts.

Only approved reusable patterns can refine questions and recommendation next steps. They cannot create factual session answers or unsupported services. Seed and synthetic records never become customer successes through approval. Guests never retrieve founder cases. Current matching uses exact option/phrase overlap, not semantic embeddings; a future `CaseRetriever` adapter can add embeddings after evaluation demonstrates value, without changing approval/privacy gates.

Fourteen seeded synthetic personas cover the original five plus existing booking, new ideas, exact teacher application scope, fleet maintenance, cross-industry booking, same-industry presentation, vague needs, no-website constraints and specialist review. The founder API also accepts a bounded validated custom synthetic persona. Runs execute the adaptive session pipeline, record actual question/answer paths, generate immutable reports and check expected/excluded services. Additional supplied fixture answers are voluntary context after adaptive progression, not compulsory catalogue completion.

Founder evaluation records a verdict, omissions, incorrect assumptions and notes. Generated reusable cases remain pending; founder review supplies a sanitized pattern and approval/rejection. Rerunning a related persona can retrieve an approved pattern, and an integration assertion verifies this. That establishes retrieval reuse, not improved real-world outcomes, retraining or automatic quality improvement. Full Case Lab visuals remain deferred.

## Recommendation reasoning and reports

Industry never creates a service recommendation alone. Saved prose can identify a supported direction with raw evidence cited. Existing booking systems lead to workflow/integration review rather than blindly installing another system. Explicit refusal of websites suppresses new site recommendations. Simple/limited budgets add a small-first-step recommendation. Static portfolios do not trigger AI or custom applications. Unfamiliar operational requirements lead to exploratory integration/feasibility work with specialist capability review, without pretending that all domains are established delivery capabilities.

Booking alternatives distinguish improving the current manual workflow, existing providers, adding a useful website channel, and custom software with greater engineering/maintenance costs. Application alternatives compare existing templates/tools, a small web version, and native mobile only with demonstrated device-specific needs. Content alternatives retain manual templates and human review; AI is conditional and can be excluded by stated preferences. Necessary requirements, optional email enhancements and proposed future publishing components retain the existing report/Canvas classification.

Estimates use existing configured inputs only; seeded consultant hours remain unset, so pricing requires review. Implementation, subscriptions, hosting/domain renewal, maintenance and future enhancement scope are separate considerations. No binding quotation, website audit, software build or publishing automation is implied.

Website capture validates HTTP(S) syntax and disallows credential-bearing addresses. It performs no network request. Context/report evidence explicitly records supplied/syntax-valid versus not fetched/not inspected. There is no SSRF-capable fetching service.

## Database and operation

Migration `202610140001_adaptive_context` adds nullable JSONB `contextState` and `planState` to `DiscoverySession`. It drops no data and does not modify historical reports. Applied successfully to local `kailor` and isolated `kailor_test`; both already had iterations 001/002 migrations. Prisma client was regenerated. No reset, staging, commit, push, merge or worktree creation occurred.

From `/Users/keenosmith/Programming/kailor`:

```sh
npm run db:generate
npm run db:migrate
npm run dev
npm run typecheck
npm test
npm run evaluate
npm run build
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run db:migrate
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
npm run simulate
```

`npm run dev` uses API 5050 and frontend 5173; do not start a second copy when those ports already have the project's running servers. The existing servers were used for browser QA after a duplicate-start attempt encountered port 5173 in use. `npm run simulate` intentionally creates founder-owned synthetic runs and pending reference cases in the configured database; integration testing isolates generated records and cleans only its own test owners. Fresh installations require PostgreSQL and `npm run db:seed` after configuring a founder password of at least 12 characters. Seeding updates the configured founder password; this iteration did not rerun it on development data.

## Verification and observed limits

Initial results: baseline 40 unit tests; workspace typechecks passed. Iteration verification includes expanded domain tests, all 14 deterministic persona evaluations and real PostgreSQL API runs. See the final execution record below for exact counts after all changes.

Browser QA exercised the actual local guest nail-technician path: business selection → natural description → booking follow-up → stated professional presence/booking outcome → conversation affordability constraints → grouped confirmation → readiness → explicit preparation → explicit Analysis. The visible report contained website, optional email and booking integration, with original descriptions as evidence and no AI/custom app. Canvas was also inspected; described channels retain an interpretation label. Three exported A4 PDF pages were rendered with bundled Poppler and visually inspected; text, margins, draft/synthetic labels and page numbering were readable. A local fontconfig file under ignored QA storage was needed for the renderer. Browser download-event capture timed out; actual PDF response/signature is verified by API tests and snapshot export, so the browser's downloaded-file delivery remains unverified. A formal accessibility audit, comprehensive mobile/browser matrix, live provider accuracy study and commercial outcome validation remain undone.

## Files

New: `backend/src/context-extraction.ts`, `discovery-planner.ts`, `discovery-readiness.ts`; additive Prisma migration; `backend/tests/adaptive.test.ts`; nine additional JSON personas; `scripts/evaluate.ts`; this iteration record and ADR 005.

Modified: shared contracts; Prisma session schema; discovery, session service, AI, library, assessment, founder/guest routes; unit/integration tests and backend test script; root evaluation script; frontend Discovery, Conversation, Canvas, SessionPage and types; relevant discovery/intelligence/case/API/architecture/data/testing documentation and README. `Intro.tsx` remains a pre-existing user change. Generated Prisma code, build outputs and QA artifacts remain ignored.

## Iteration 004 priorities

Evaluate extraction against a larger labelled language corpus, including negation/corrections and multi-intent descriptions; add explicit source quotes and richer proposal provenance. Verify authorized live Cloudflare quality and account-level free-tier controls. Add a founder evaluation interface over the working custom-persona/review APIs. Improve retrieval vocabulary and assess embeddings only against concrete cross-domain failures. Separate feasibility exploration from implementation catalogue services, expand capability-reviewed domain patterns, and refine content versus publishing terminology. Add question-history retention and revision-scoped input draft handling if full interactive replay is required. Verify browser downloads and a wider responsive/accessibility matrix. Any future web inspection needs SSRF protections and verified evidence stages.

## Final execution record

- `npm run typecheck`: all three workspaces passed.
- `npm test`: 78 tests passed across two files.
- Isolated PostgreSQL `npm run test:integration`: 31 tests passed. This includes guest forced-local inference with dummy remote configuration enabled and no outbound request/reservation, even when the service caller omits forceMock.
- `npm run evaluate`: all 14 synthetic fixtures passed; zero missing/excluded-service or ungrounded-evidence failures.
- Existing `scripts/simulate.ts` CLI entry point: all 14 personas passed against kailor_test using a disposable test owner; only that owner's generated records were cleaned.
- `npm run build`: shared, backend and frontend passed; final Vite production build succeeded.
- `git diff --check`: passed; nothing staged or committed.
- Migration deployment: succeeded on kailor and kailor_test, preserving existing records.
- Browser: the primary guided/chat/confirmation/readiness/explicit report flow passed; saved report reopened; answer review produced revision 7; Canvas displayed the same three directions and labelled described channels.
- Final revision-7 PDF: three A4 pages rendered and visually reviewed. Browser downloaded-file event capture remained unverified after timeout; API PDF/signature and snapshot export passed.
- Cloudflare: credentials absent, remote disabled; no live call or paid activation occurred.

A reference-reuse assertion initially depended on tied match scores and intermittently omitted the target from the top four. Its reviewed fixture was corrected to include distinguishing tool/goal factors actually present in the related persona; the final integration run passed. Earlier compilation/build successes were repeated after subsequent code changes. No blocked test suite remains; the live/provider and browser-download limitations above are validation gaps, not invented successes.

## Exact change manifest

Paths below are relative to the repository root. The pre-existing Intro.tsx change is excluded because this iteration did not edit it.

```text
README.md
backend/package.json
backend/prisma/migrations/202610140001_adaptive_context/migration.sql
backend/prisma/schema.prisma
backend/src/ai.ts
backend/src/app.ts
backend/src/assessment.ts
backend/src/context-extraction.ts
backend/src/discovery-planner.ts
backend/src/discovery-readiness.ts
backend/src/discovery.ts
backend/src/guest.ts
backend/src/library.ts
backend/src/session-service.ts
backend/tests/adaptive.test.ts
backend/tests/integration.test.ts
backend/tests/unit.test.ts
data/personas/cross-industry-booking.json
data/personas/existing-booking.json
data/personas/fleet-maintenance.json
data/personas/new-idea.json
data/personas/no-website.json
data/personas/same-industry-portfolio.json
data/personas/specialist-review.json
data/personas/technical-founder.json
data/personas/vague-user.json
docs/api/API_REFERENCE.md
docs/architecture/ARCHITECTURE.md
docs/architecture/DATA_MODEL.md
docs/case-library/CASE_INTELLIGENCE.md
docs/decisions/005-adaptive-projections.md
docs/deployment/LOCAL_SETUP.md
docs/discovery/DISCOVERY_ENGINE.md
docs/frontend/DESIGN_SYSTEM.md
docs/intelligence/INTELLIGENCE_DESIGN.md
docs/iterations/003-adaptive-intelligence.md
docs/testing/TESTING_STRATEGY.md
frontend/src/Canvas.tsx
frontend/src/Conversation.tsx
frontend/src/Discovery.tsx
frontend/src/SessionPage.tsx
frontend/src/types.ts
package.json
scripts/evaluate.ts
shared/src/index.ts
```
