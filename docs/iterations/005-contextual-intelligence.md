# Iteration 005 — Contextual intelligence and approved case reasoning

Implementation began 14 October and continued 15 October 2026 in the existing repository. Changes remain uncommitted. No staging, commits, push, merge, history rewriting, worktree, deployment, billing activation or database reset/reseed was performed. The working tree was clean at the initial audit. Introduction, mascot assets, CSS, scroll transitions and the global visual system were preserved. The removed “Review your answers” control was not restored.

## Baseline and audit

Read iteration 003/004 records and audited discovery planning/readiness, extraction, evidence/input policy, conflicts, answer mutation, session service, assessment, retrieval, inference, conversational guidance, shared contracts, Prisma, all named frontend views, scenarios/personas/evaluations, tests and scripts. Initial execution: 178 unit tests, 100 isolated PostgreSQL integration tests, fourteen persona evaluations and 57 reliability cases passed; workspace typechecks passed. The first sandboxed database attempt could not connect; the same isolated suite succeeded with local-network execution enabled.

The principal gaps were shared activity/knowledge revision semantics, broad catalogue workflow questions, hints-only case reuse, JSON-only pattern review, repeated conversational suggestions and absent draft persistence. Earlier approval/source controls, readiness gates, correction history, local fallback and immutable reports were retained.

## Context and discovery architecture

`contextual-intelligence.ts` derives source-linked statements and ten shared dimensions: capture, communication, scheduling, collaboration, approvals, reporting, automation, presentation, application and offline use. It does not branch by industry. `buildContext` exposes current/desired process, capabilities, limitations, technical requirements, objectives, open gaps and the existing facts/preferences/corrections projection. Clauses are labelled confirmed description, hypothetical, unverified or superseded. “Confirmed” means user-confirmed source content, not externally verified truth. Dimension/category assignments remain deterministic interpretations.

Independent objectives in one saved description can produce multiple objective entries and recommendations: a consultant's portfolio and repetitive invoice workflow remain separate. Existing tool statements are distinguished from a desire to adopt a tool. Explicit negative preferences and latest confirmed correction facets override old prose. Tentative app-versus-website comparisons request a decision; they do not replace confirmed scope. A subsequent explicit cancellation and website requirement are proposed, then applied through the normal confirmation writer. Pure advice questions do not supply tools or requirements.

```mermaid
flowchart TD
  Answers[Answers and confirmed evidence] --> Context[Source-linked context projection]
  Context --> Gaps[Relevant decision gaps]
  Catalogue[Version-compatible question catalogue] --> Rank[Deterministic priority selection]
  Gaps --> Rank
  Cases[Approved source/version patterns] --> Rank
  Rank --> Plan[Revision-persisted plan and planned-question history]
  OptIn[Explicit authorized follow-up request] --> Validate[Bounded model wording validation]
  Plan --> Validate
  Validate --> Plan
  Answers --> Eligibility[Current evidence determines service eligibility]
  Eligibility --> Compare[Proportionate approach comparison]
  Cases --> Compare
  Compare --> Snapshot[Immutable assessment, Canvas and PDF]
```

New optional questions cover offline storage/sync, record capture, roles/access, downstream reporting, integrations, existing booking capabilities, website content ownership, existing alternatives and smallest useful version. They use existing answer validation/mutation endpoints and persist stable IDs, text types and complete definitions. Example: the agricultural machinery requirement selects offline operation first, then record/access/reporting gaps; it produces an exploratory workflow feasibility direction, not portfolio, booking or AI recommendations.

## Selection policy

The existing starting-context and situation/objective priorities remain. Contextual scores are offline 850, booking capabilities 745, capture 735, roles 720, reporting 690, integration 670, website content 660, existing alternatives 640 and first version 620. These priorities represent decision impact, not probability. Already supplied detail can remove a gap. Answered, skipped, unknown and not-applicable IDs do not repeat automatically. Constraints and optional budget semantics remain unchanged. Specialist or unresolved material contradictions continue to block inappropriate assessment preparation.

An approved matching pattern can add 80 points only to a gap independently supported by current context. It cannot activate an unrelated question. A smaller legacy workflow hint bonus remains. Ties use stable ID ordering. A preliminary report can be prepared while useful optional questions remain; the planner does not make the examples a mandatory questionnaire.

`planState` retains question definitions, reasons, reference IDs, source/version, current readiness and planned-question history across views. History records planned transitions, not proof that the user actually saw every intermediate transactional plan. It does not fabricate earlier historical question presentations.

## Model-assisted planning and provider status

Normal guided discovery stays deterministic. Only an explicitly requested follow-up in founder-authorized remote chat can return an optional `followUp`. Its ID must equal the current contextual gap, remain unanswered and retain the catalogue's text answer type. Wording must pass bounds, quality, topic vocabulary and instruction/claim checks. The transaction checks the original session revision again and persists wording, provider, source message ID, source revision and validation result. Reloads reuse that saved plan. The model never edits answers directly.

`npm run evaluate:live` checks existing provider configuration; it does not activate remote inference or billing. If already enabled with valid credentials, it permits only the isolated `_test` database, at most three approved synthetic prompts, output ceiling 600 tokens and existing session/daily ceilings no greater than 5/20. Reservations and timeout/fallback behavior remain the production path. Clearly synthetic evaluation records and usage are retained for review/accounting.

Executed configuration check: provider `mock`, remote opt-in false, credentials absent. No live inference was executed. Live model quality remains unverified. Controlled provider contracts, malformed/fabricated output, sensitive-context rejection, rate limits, timeouts and fallback tests were executed. A mocked remote integration test validates persisted follow-up navigation; it is not a live Cloudflare success claim.

## Natural conversation and cross-view continuity

Advice about retaining software, affordability, smaller scope, existing alternatives, offline tradeoffs and previous explanations receives concise contextual replies. Greetings and acknowledgments create messages without factual proposals. Suggestions reflect invoice, website, booking, app, offline and unresolved-gap context and remain accessible after messages exist.

Discovery and Conversation still read the same authoritative session/evidence and saved plan. Confirmation refreshes the next question. A rejected exact proposal stays rejected under the existing history policy. Text drafts use tab-scoped `sessionStorage`, keyed by session/field and knowledge revision. Ordinary chat does not invalidate a draft; a confirmed knowledge change does. Sending/saving clears the relevant draft, restart clears the old session, and founder logout clears all kailor drafts. Drafts expire logically after thirty minutes; pruning runs on use, every minute while SessionPage is mounted, and on page/visibility restoration. Browser timer suspension can delay physical deletion. Tab closure removes session storage. Storage failure falls back to the normal in-memory input. No drafts are sent to a model or saved in the database. This is not encrypted secure storage; avoid entering identifiers into drafts.

## Knowledge revision, readiness and compatibility

`revision` continues to advance for messages, proposals, reviews and answers and remains required on mutations. Message ordinals remain based on the activity revision and row locks prevent concurrent duplicate turns. `knowledgeRevision` advances for changed answer values/states, branch removal or changed resolved interpretations. Repeating the same answer does not create another report.

Assessment reuse, report freshness and Canvas snapshot lookup compare knowledge revisions. A pending material contradiction can block a new assessment separately from whether a snapshot is stale. A confirmed material correction marks the earlier assessment stale. Historical JSON/PDF remains unchanged. Reference-library updates do not silently update or stale saved reports; future client knowledge changes can create a new assessment using current approved references.

Migration `202610140003_contextual_knowledge` adds two integer columns and an assessment lookup index. Legacy session values are backfilled from `revision`; legacy assessments from `sessionRevision`. Applied to local `kailor` and isolated `kailor_test`, without reset or seed. Existing report content is not rewritten. Definition `1.0.0` is retained; original IDs and validation remain compatible, new optional IDs are additive and planner `contextual-3` lazily refreshes older projections. Unknown future definition versions remain rejected instead of guessed.

Readiness still requires useful situation/objective evidence and an independently defensible direction with no unresolved material conflicts. Budget is optional; placeholders, all-skipped questionnaires and vague “platform” requests do not manufacture readiness. Unfamiliar operations may receive a preliminary exploratory review, while clinical diagnosis/treatment decisions require specialist handling.

## Approved cases and solution comparison

`solution-evaluation.ts` runs after evidence-based service eligibility. It compares proportionate current-process, third-party configuration/integration and exploratory engineering approaches. It records why a small change/current provider or feasibility review is preferable. Approved patterns may add reusable approach titles, rationale, dependencies, explicit unsuitable-state conditions and follow-up dimensions. A related scheduling pattern can inform an existing-provider integration recommendation even when its original source used a standalone booking provider. It cannot add a website merely because the original client needed one.

Reference effects include ID, review version, source classification, matching reasons, limitations and an unverified outcome label. Source run IDs are preserved in report metadata. Current-client evidence remains the only client fact source. Pending/rejected references are excluded. Unrelated and harmful references are tested. The seven report sections, Canvas service composition and existing PDF generator consume the same result, with snapshot text carrying approach reasoning and limitations.

This is bounded pattern reuse, not a generic solution optimizer: arbitrary case prose is not an executable constraint language, delivery categories remain the established service catalogue and novel engineering requires feasibility/domain review. No automated price, ROI, implementation promise or customer success story is created.

## Founder review

The private Workspace retains its layout and adds focused form controls. Founder can select a synthetic persona, inspect its planned discovery path and exact source assessment, record incorrect assumptions/omissions/verdict/notes, edit matching factors and reusable alternatives/dependencies, select supported services and follow-up dimensions, approve/reject, and compare another synthetic case. Ordinary review requires no JSON editing; technical JSON is read-only inside an expandable area.

`GET /api/simulations/:id` is ownership-scoped and returns the exact assessment snapshot linked by the source run, including older runs outside the list's fifty-item window. Existing evaluation and review endpoints remain. Review updates acquire a case row lock, preserve the previous complete pattern/review state in audit history, increment `reviewVersion`, and optionally reject a stale submitted review version. The UI submits that version. Known sensitive-data patterns are rejected on approval; founder sanitization is still required. Approval cannot change `sourceType` or mark outcomes verified. Review history is preserved in existing audit storage, not a new dashboard.

## Learning evaluation and evidence

A separate manually labelled corpus contains fifteen cases across agricultural work, factory quality, fleet work, property, healthcare administration, events, construction, nonprofits, education, consultancy, personal productivity and negative/ambiguous/specialist examples. Each records situation, outcome, confirmed/unverified information, useful follow-up dimensions, unacceptable assumptions, solution categories, readiness and reference relevance. Actual gaps, dimensions, recommendations and failures are recorded by `npm run evaluate` under `.cache/qa/iteration005/intelligence.json`.

The before/after comparison uses a related but different client with an existing website/provider, reminder/cancellation problems and an initial app request. Baseline: next question `scopeDetails`; approved reference: `bookingCapabilities`. The approved pattern adds existing reminder/cancellation configuration as an alternative and vendor-permission verification as a dependency, while retaining identical client facts and excluding another website. Independent criteria require that difference, useful current-provider checks, preserved facts and no blind website reuse. The five independently defined criteria score 4/5 before reuse and 5/5 after reuse: both runs already compare reminders, check provider permissions, preserve client facts and avoid another website; the measured improvement is investigating the current provider before application scope. Service eligibility does not change. The evaluated result is `improved` for that bounded synthetic test. Retrieval alone or the same question without useful suitability checks does not count as improvement.

The isolated API acceptance runs the requested nail business with Instagram/WhatsApp, independent work, presentation/easier appointments and limited scope; generates a report; records unsupported assumptions/omissions; approves a sanitized pattern; applies it to a separate related session; and verifies source classification, approval/version history, later version/rejection behavior and immutable prior reports. `.cache/qa/iteration005/learning-api.json` records the executed difference. These artifacts contain only synthetic inputs. Existing fourteen personas and 57 reliability cases remain independent regression targets. This is not evidence of real-client effectiveness, broad semantic accuracy or automatic learning.

## Privacy and output controls

Credentials remain server-side. Guest/simulation calls stay local. Founder opt-in, reservations, per-session/day limits, output bounds, timeouts and local fallback are preserved. Remote requests omit historical conversation, supplied website address, budget and timing, and bound included answer text. Sensitive-data screening runs before reservation and again before the provider HTTP call. Full context/history is conservatively checked locally; if required information cannot safely be sent, the local path is used.

Provider JSON is untrusted: schema, known question/choice validation, exact source quotes, text grounding, duplicate-key rejection, contradictory proposals, hypothetical statements, source-supported preference choices and generated-gap validation are enforced. Checks reject known fabricated inspection/expertise/pricing claims and repeated exact recent replies. Neither regex screening nor these reply checks provide complete data-loss prevention or complete hallucination detection. No website inspection is performed.

## Verification

Final execution and browser coverage are recorded below after the final checks. Earlier intermediate runs exposed test setup ordering, a source-classification assertion and interference between integration files sharing reference approvals/configuration. The integration command now runs files sequentially; production locking/rate limits were not weakened. Existing behavioral assertions were updated only where a more specific question intentionally supersedes a generic workflow/no-follow-up expectation, and where rejected chat must keep a report current.

The live provider configuration check reports no credentials and no opt-in. Browser PDF download-event capture timed out; browser download completion is not asserted. API tests verify PDF response/signature. No full accessibility or physical-device compatibility certification is claimed.

## Exact local commands

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
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run evaluate:live
```

The normal servers remain frontend 5173/API 5050; reuse already running servers. No seed is necessary for an existing installation. Do not run database reset/reseed. The temporary browser QA server on loopback 5052 uses only `_test` and a disposable synthetic founder; it is stopped and its owner-specific records removed after QA.

## Remaining limits and iteration 006 priorities

Expand the independently labelled corpus with paraphrases, languages, complicated negation, multi-turn references and multi-objective corrections. The local extractor remains deliberately narrow, and objective splitting is heuristic. A context category is not externally verified technical understanding. Guided questions can be more numerous; assess whether each gap changes a decision using human review and observed user paths.

Run authorized bounded live Cloudflare quality evaluation when credentials/configuration exist, then manually score hallucinations, question relevance and privacy failures. Constrained question rewording is not broad model-generated discovery. Current reply/sensitive-data heuristics are incomplete and context minimization can remove useful history.

Extend capability-reviewed offline/data workflows through technical prototypes and specialist review before promising delivery. Improve alternative suitability evaluation with independently justified conditions; do not introduce vector retrieval or fine-tuning without measured failures that it improves. Preserve a larger negative corpus and quantify degradation/no-effect cases, rather than extrapolating from one improved synthetic pair.

Finish a broader accessibility/device/browser matrix and reliable browser download instrumentation. Keep drafts short-lived and explicit; suspended tabs can retain expired storage until the next pruning event. Consider a dedicated versioned case record API if audit history becomes hard to navigate, while keeping all prior snapshots intact.

## Browser execution record — 15 October 2026

Executed in Chrome against the existing local frontend/API and a temporary loopback server on 5052 using only `kailor_test` and a disposable synthetic founder account:

- Guided specific-requirement selection and the agricultural/offline free-text request; selected offline clarification, then access/roles after capture/sync detail.
- Discovery → Conversation → Discovery transitions, with both unsent text drafts retained at the same knowledge revision.
- A conversational AI refusal remained as proposals until grouped confirmation; returning to Discovery reflected the confirmed preference.
- Explicit assessment preparation stayed on Discovery; Analysis required its own navigation action. Seven-section navigation and the saved exploratory feasibility approach were inspected.
- Browser greetings/thanks after preparation preserved the report with no stale notice. Canvas read the same saved snapshot and explicitly labelled the delivery exploratory.
- Founder sign-in using the isolated QA account; persona selection, source path/findings inspection, ordinary form editing, assumption/omission notes, category/dimension selection, approval, preserved `simulation` classification/version/unverified outcome label, and comparison with another completed synthetic case.
- Restart created a separate discovery. An uncertainty/skip-only path reached insufficient discovery with no preparation action; “Tell kailor more” opened a usable recovery prompt.
- Actual 390 × 844 viewport checks on founder Workspace, contextual Discovery, Conversation and Analysis; Discovery and Conversation had `scrollWidth === innerWidth === 390`. Captured layouts were visually inspected; no horizontal clipping was observed. The temporary viewport override was reset. This is browser emulation, not a physical-device test or complete accessibility audit.
- The PDF download button was executed, but the browser download event timed out after twelve seconds. The browser policy blocked opening the internal downloads page; no workaround was attempted. Browser download completion remains unverified. API PDF response/signature tests pass.

The temporary QA process shut down successfully and removed only its own test account, sessions, synthetic cases, subjects and audit records. The normal local servers and existing development records were preserved. Guest QA discoveries intentionally remain in their existing local guest history.

## Final execution record — 15 October 2026

| Check                                                  | Actual result                                                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:generate`                                  | Passed; Prisma client regenerated                                                                                             |
| `npm run db:migrate`                                   | Additive migration applied successfully to local `kailor`                                                                     |
| Isolated `kailor_test` migration                       | Applied successfully; no reset/reseed                                                                                         |
| `npm run typecheck`                                    | Passed in all three workspaces                                                                                                |
| `npm test`                                             | 228 passed in four files; original 178-test baseline retained                                                                 |
| `npm run test:integration` with documented `_test` URL | 109 passed in three sequential files; original 100-test baseline retained                                                     |
| `npm run evaluate`                                     | Fourteen personas, 57 reliability cases and fifteen independent contextual cases passed; zero failures                        |
| Before/after approved-case evaluation                  | 4/5 → 5/5 criteria; `scopeDetails` → `bookingCapabilities`; facts and eligible services preserved                             |
| Founder approval/learning API acceptance               | Executed successfully, including source/version history, later rejection, immutable reports and PDF signature                 |
| Controlled generated-question integration              | Executed against a mocked provider; persisted question/provenance stayed stable on reread without changing knowledge revision |
| `npm run build`                                        | Shared, backend and Vite production build passed                                                                              |
| `npm run evaluate:live`                                | Configuration check executed; no credentials, mock provider, remote opt-in false; no live model calls                         |
| `git diff --check`                                     | Passed                                                                                                                        |

Test/evaluation artifacts are under `.cache/qa/iteration005/`, including `intelligence.json`, `learning-api.json`, `live-inference.json`, `verification.json` and copied execution logs. They contain synthetic QA evidence, not real-client inference results. The broader browser/physical-device matrix, accessibility certification and live model quality remain unverified as described above.

## Source manifest

The iteration's source changes are listed below, left uncommitted for review. Generated Prisma files, build outputs and `.cache/qa` artifacts are excluded from this source list.

A later unrelated `.gitignore` edit was observed and left untouched. It removes the earlier `.cache/` and `backend/src/generated/` exclusions, so those existing/generated directories currently appear as untracked. This iteration did not rewrite that file or remove its newly visible artifacts.

Modified:

- `README.md`
- `backend/package.json`
- `backend/prisma/schema.prisma`
- `backend/src/ai.ts`
- `backend/src/answer-mutation.ts`
- `backend/src/app.ts`
- `backend/src/assessment.ts`
- `backend/src/context-extraction.ts`
- `backend/src/conversation-guidance.ts`
- `backend/src/discovery-planner.ts`
- `backend/src/discovery.ts`
- `backend/src/evidence-policy.ts`
- `backend/src/input-quality.ts`
- `backend/src/knowledge-conflicts.ts`
- `backend/src/library.ts`
- `backend/src/session-service.ts`
- `backend/tests/adaptive.test.ts`
- `backend/tests/integration.test.ts`
- `docs/api/API_REFERENCE.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/case-library/CASE_INTELLIGENCE.md`
- `docs/deployment/LOCAL_SETUP.md`
- `docs/discovery/DISCOVERY_ENGINE.md`
- `docs/frontend/DESIGN_SYSTEM.md`
- `docs/intelligence/INTELLIGENCE_DESIGN.md`
- `docs/testing/TESTING_STRATEGY.md`
- `frontend/src/Analysis.tsx`
- `frontend/src/Canvas.tsx`
- `frontend/src/Conversation.tsx`
- `frontend/src/Discovery.tsx`
- `frontend/src/SessionPage.tsx`
- `frontend/src/Workspace.tsx`
- `package.json`
- `scripts/evaluate.ts`
- `shared/src/index.ts`

Added:

- `backend/prisma/migrations/202610140003_contextual_knowledge/migration.sql`
- `backend/src/contextual-intelligence.ts`
- `backend/src/intelligence-evaluation.ts`
- `backend/src/solution-evaluation.ts`
- `backend/tests/contextual.integration.test.ts`
- `backend/tests/contextual.test.ts`
- `data/evaluations/contextual.ts`
- `docs/decisions/007-contextual-knowledge-and-case-reasoning.md`
- `docs/iterations/005-contextual-intelligence.md`
- `frontend/src/drafts.ts`
- `scripts/evaluate-live.ts`
