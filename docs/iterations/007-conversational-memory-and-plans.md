# Iteration 007 — Conversational memory and independent plans

Implemented in `/Users/keenosmith/Programming/kailor` on 15 October 2026, building on local HEAD `c5b1df8` (iteration 006). The initial working tree was clean. No branch, worktree, staging, commit, push, merge, deployment, database reset, destructive reseed or founder credential change was performed.

## Implemented outcome

An account can create, name, describe, open, rename, archive, restore, compare and resume independent business/project plans. Each plan retains separately owned discovery sessions, messages, evidence, revisions, readiness, Canvas and immutable report history. Plan switching preserves per-discovery drafts and current progress. A new discovery is a fresh epoch within the chosen plan; creating another business is a separate explicit action. Old sessions remain selectable and their existing URLs work.

Natural mentions of another business propose a separate plan without adding that business to current evidence. Create separate plan, Keep discussing current plan and Cancel are real owner-authorized actions. A model cannot create/switch/archive/reassign plans autonomously. Ordinary inference excludes application-action turns and never loads another plan's facts. Multiple goals for one salon remain one plan.

The memory pipeline combines authoritative current knowledge, bounded recent history, persisted/versioned categorized excerpts, query-dependent older-message retrieval, explicitly reviewed account defaults and separate curated case references. Corrections supersede affected summaries and facts; rejected proposals invalidate continuity memory without automatically staling a valid report. The underlying history and previous summaries remain.

## Architecture and ownership

```mermaid
flowchart TD
  A[Private account] --> P[Owned plans]
  A --> AP[Explicit account defaults]
  A --> S[Revisioned active selection]
  P --> D[Independent discovery sessions]
  D --> K[Confirmed answers and evidence]
  D --> H[Complete message history]
  D --> M[Versioned unconfirmed summaries]
  D --> R[Immutable assessments and reports]
  K --> C[Scoped model context]
  H --> C
  M --> C
  AP --> C
  CI[Approved case references] --> C
```

Plan is a relational model with immutable UUID/owner, title/description, archive timestamp, lifecycle revision, creation key and last explicitly selected discovery. `DiscoverySession(planId, adminId)` references `Plan(id, adminId)` with a composite FK. Plan selection also checks session membership. AccountSettings stores the previous explicit selection with its own revision. Plan lists retrieve metadata rather than all conversations; plans, discoveries and report histories paginate.

Plan creation serializes the owner and uses owner-scoped UUID request keys. Repeated identical requests return the existing plan; mismatched content with the same key is rejected. A conversational proposal uses its immutable proposal ID as the creation key and atomically records the explicit decision. Selection conflicts between tabs return 409 instead of silently overwriting one another. Lifecycle, session activity and knowledge revisions remain distinct. Rename/archive does not rewrite reports or another business's evidence.

ADRs: [009 ownership/lifecycle](../decisions/009-plan-ownership-and-lifecycle.md), [010 memory authority](../decisions/010-personal-memory-authority.md), [011 summary lifecycle](../decisions/011-versioned-memory-lifecycle.md), [012 explicit cross-plan operations](../decisions/012-explicit-cross-plan-operations.md), [013 routing/model choice](../decisions/013-plan-aware-model-routing.md).

## Migration and existing data

`202610150001_plans_and_memory` adds Plan, AccountSettings, AccountPreference, ConversationSummary and PlanActionProposal, a required session-plan ownership relation, indexes and message intent/context-exclusion metadata. The Prisma client was regenerated. Existing Subject labels and all session/report IDs remain unchanged.

Every old session receives its own plan, deterministically using its old session UUID as the new plan UUID and `legacy:<session-id>` as the creation key. Repeated names or even a shared historical Subject do not merge sessions or owners. This may expose multiple similarly named historical plans; explicit renaming is the safe default. No historical transcript/evidence/report contents or credentials are rewritten.

The migration was applied to `kailor_test`, then to the existing local `kailor` database after the isolated tests passed. A dedicated migration test builds the six-version old schema in a random disposable schema inside `kailor_test`, inserts multiple old sessions with shared labels and different owners plus evidence, conversation, credential hash and report, migrates and checks unchanged content and cross-owner FK rejection. Only that disposable schema is removed. No development data was reset or reseeded.

## Memory, context selection and corrections

Confirmed current facts and confirmed corrections outrank pending proposals, old conversational text, model assumptions, account defaults and reference cases. Personal memory never becomes approved Case Intelligence automatically. Account defaults are explicitly saved from review controls, limited to communication style/general implementation preference. They can be corrected or cleared. A cleared value retains a revision tombstone while its old text is removed; it is omitted from inference. Budget, timing, tools and operational facts stay plan-specific.

Recent context defaults remain twelve messages/12000 characters, configurable with the existing context settings. Summaries begin only after at least twelve older messages exist beyond the recent window. They refresh after twelve newly covered older messages or invalidation, not on reads/page loads or every turn. The refresh transaction follows the saved-message transaction; failure cannot roll back a successfully saved turn. A safe fallback event records the failure without prompt contents.

Stored versions include session ID, knowledge/source revision, strategy, ordinal coverage, timestamp and superseded state. Excerpts preserve exact source wording, message IDs/roles/ordinals, category, temporal status and truncation. Category retention keeps up to four alternatives/decisions/questions/discussion entries each, sixteen entries total, each at most 1200 characters and 8000 text characters overall. A correction rebuild scans up to 120 eligible older messages; incremental refresh carries forward retained relevant entries. This is bounded, lossy memory, not a comprehensive semantic summary of every covered message.

Query-dependent retrieval uses at most five useful terms and preserved alternative/decision sources, at most six older messages/6000 characters, always scoped to the selected session. The current message is appended once. Current knowledge and pending confirmations remain separately labelled. A confirmed correction transactionally supersedes summaries; conflicting old excerpts are marked superseded on rebuild, so old app requests cannot silently regain authority. Rejected-source excerpts are excluded from rebuilds. No semantic summarization model, embedding store or extra summary inference call was introduced; absent credentials and strict call allowances make unvalidated model summaries unjustified in this iteration.

## Conversation intelligence and confirmations

Lightweight intent routing distinguishes greetings, descriptions, questions/comparisons, explanations/recommendations, summaries, corrections, assessment requests, separate-plan proposals, switching/comparison requests and off-topic input. The model may supply strictly validated optional intent/grounded proposal fields; application actions remain deterministic and require explicit user decisions. Ambiguous other-business mentions offer a reviewable proposal, never automatic creation. An unsupported model action intent cannot create a plan or discard a normal business turn.

Local fallback gives useful technical website-builder explanations, actual plan summaries, confirmed budget recall, historical option references and clear clarification for ambiguous pronominal references. Authorized complex conversational turns can use Cloudflare with current scoped context. This is an integration and deterministic fallback improvement; general natural-model quality is not claimed.

Current, historical and planned clauses are distinguished: used-to, planning-to and eventual app scope do not become current tools/app requirements. Current website needs in a separate clause remain eligible for confirmation. Actual closure of a website and confirmed application refusal persist across switching. Multi-objective goals remain together. Budget extraction now retains its actual source clause where possible instead of repeating unrelated business prose.

A reusable ordering/customization/fulfilment dimension adds the `orderWorkflow` gap: variants, artwork/files, approvals, payment, production, delivery, existing tools and first useful version. This serves ordering workflows broadly rather than a t-shirt-specific dialogue catalogue. The shared planner suppresses application suggestions after confirmed refusal. Cached planner version `plans-memory-4` rebuilds older projections without changing underlying knowledge.

Evidence remains confirmation-gated and uses the existing writer for Discovery and Conversation. Text evidence can be edited; invalid edited types/options safely return 400 without changing state. Rejection history, corrections, skipped questions and material report freshness remain. Summary/explanation/greeting activity does not automatically stale a report.

## Cross-plan comparison and security

Explicit comparison accepts exactly two distinct owned plan IDs, checks both before retrieving requirements and returns labelled/minimized confirmed facts plus unknowns. It makes no remote call and writes no evidence or official assessment. A normal turn asking about another business points to this explicit interface instead of implicitly accessing it.

Founder auth/origin controls and local guest restrictions are preserved. Guests manage only their own preview plans and remain local-inference/seed-reference-only. Another account cannot read/rename/select/archive a plan, see its sessions/evidence/assessment/report/PDF, create a discovery under it or include it in comparison. The composite FK also rejects cross-owner session assignment. Plan changes and important preference/proposal/selection events use the existing audit infrastructure without raw provider prompt logging.

Per-session inference allowances and the global daily advisory-lock reservation remain. The global daily limit also bounds each account across all plans, so another plan cannot reset the overall allowance. Failed attempts count. There is no automatic inference retry or exactly-once charging guarantee; concurrent turns may reserve independently before a session revision conflict rejects one persistence operation.

## Cloudflare audit and live status

The existing opt-in is **false**, credentials are **absent** and provider remains **mock**. `npm run evaluate:live` recorded `executed:false`. No real model response, account billing state, quality score or zero-charge guarantee is claimed. No paid billing was enabled.

The old `@cf/meta/llama-3.1-8b-instruct` public documentation now redirects to an unavailable-model page. The fallback default and `.env.example` now specify the documented `@cf/meta/llama-3.1-8b-instruct-fp8` variant; explicit existing `.env` values are preserved, including the old local model string. Review that setting before remote opt-in. See [Cloudflare FP8 model documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/) and [pricing/free-allocation documentation](https://developers.cloudflare.com/workers-ai/platform/pricing/), inspected 15 October 2026. Public free allocation is not proof of this account's billing configuration.

The live harness stays bounded to at most three remote attempts against synthetic data in `_test`, with output ≤600 tokens/session ≤5 calls/daily ≤20. It seeds a distant numbered comparison and filler locally to exercise persistent memory, then tests an earlier-option reference, cost comparison limitations and an unconfirmed scope correction. It records the deterministic baseline, actual provider response/fallback, usage and a pending human review rubric. Contract/semantic validation passing is distinct from human assessment of model quality. Provider timeouts, malformed output, rate/context/auth failures retain local fallback and valid session state.

## Frontend integration and preserved features

The plan indicator derives from the actual loaded session. Stale route loads cannot replace a newly selected plan's content. Change plan opens compact native controls for create/resume/rename/archive/restore, older discoveries, summary, report history, comparison and explicit account defaults. Plan names use stable UUID routes. A new discovery preserves the previous session and its draft rather than creating another business or destroying history. Request keys survive failures for retry protection.

Drafts remain per-discovery/session, expire after thirty minutes in session storage and do not cross plans. Archived content is disabled through a fieldset while navigation/history remain available; archive state does not masquerade as a processing request. Original static mascot art, split-screen composition, cream palette, reduced-motion transitions, composer/IME controls and safe React-text rendering remain. No Introduction, Canvas, Analysis or PDF redesign, streaming, new artwork or generic SaaS dashboard was added. The founder simulator and reviewed learning loop remain intact.

## Evaluation and actual verification

Baseline: typecheck, 250 unit tests, 112 isolated database tests, production build and all existing evaluations passed. Baseline matched iteration 006's documented counts. An early post-migration regression run recorded two timeouts; a full rerun passed without increasing timeouts. A later strengthened summary assertion exposed the distinction between lossy discussion retention and explicit decision retention; the fixture now explicitly records a decision and verifies its superseded label after correction. Resolved facets, rather than only leftover conflicting answer text, now drive that label. They remain an observed transient execution failure, not a claimed performance regression or improvement. No data was altered to satisfy assertions.

Final counts and browser results are recorded below. The deterministic corpus tests behavior, not live intelligence accuracy or artificial percentage improvements.

- `npm run typecheck`: passed across all workspaces.
- `npm test`: 271 tests passed, six files.
- `npm run evaluate`: all 14 personas, 57 reliability cases, 15 intelligence cases/learning checks, eight earlier conversation cases and twenty new multi-turn scenarios passed (28 conversation scenarios total).
- `npm run build`: backend/shared TypeScript and frontend Vite production build passed.
- Isolated PostgreSQL suite: 124 passed, five files.
- `npm run evaluate:live`: skipped with provider mock, opt-in false, credentials absent; artifact records this explicitly.
- `git diff --check`: checked after formatting, including generated-comment whitespace normalization.

The new corpus includes short/medium/long conversations, two-business proposals, ambiguous new plans, switching/cross-plan intents, multiple salon objectives, technical questions, temporal spreadsheet/future-app statements, website closure, ordering/customization, budget recall/absence, unfamiliar offline work, assessment requests, hypothesis retention, injection recovery, old alternative retrieval and repeated greetings. Rubric checks intent, required/forbidden proposals, factual references, retained constraints/corrections and readiness. Output records actual failures rather than assigning unsubstantiated natural-language scores.

Database coverage includes idempotent/concurrent create, selection conflict, rename/stale revisions, archive/restore, multiple discoveries, independent budgets/reports/knowledge, exact provider context isolation, explicit plan proposal decisions/cancel/stale retry, source-backed long-history retrieval, no read-time summary generation, correction invalidation/rebuild, account default review/clear, cross-account/guest denial, shared inference budget, edited-input rejection and non-destructive old-schema migration. Existing Canvas/PDF/report/evidence/simulation suites remain.

Observed browser acceptance completed: create nail plan; answer guided starting state and continue Conversation; confirm channels/goals/budget; propose/create printing plan; confirm independent ordering/budget; switch back with prior nail draft/history restored; ask where we were; confirm website scope correction; prepare nail assessment; return to printing and verify its original draft and absence of the nail report; rename printing; archive/restore with history/draft preserved; compare both explicitly with separate budgets; inspect nail summary and immutable report history; reload; use direct plan URLs/browser history; open the pre-migration conversation and prepared assessment. Desktop 1280×900, tablet 900×900 and mobile 390×844 layouts were inspected; DOM viewport/content widths matched at 1280, 900 and 390 with no horizontal overflow. A new discovery was started within the printing plan and the earlier discovery was explicitly resumed. No physical iPhone/device-keyboard test or exhaustive accessibility/browser matrix is claimed.

## Generated-output housekeeping

`.cache/` is now ignored for generated QA JSON/logs/screenshots and temporary migration schemas. Source evaluation fixtures remain under `data/evaluations` and tests remain source-controlled. Previously tracked historical `.cache` artifacts are not deleted or untracked here; their refreshed output still appears in the working diff until the owner decides the index policy. The required Prisma client is regenerated and remains in the existing tracked structure. No Git index operation was performed.

## Known limitations and follow-up

Live model quality, semantic summary accuracy and actual account billing are unverified. Local fallback is deliberately limited, and rule-based temporal/new-business recognition cannot understand every phrasing. Ambiguous references ask for clarification. Summaries/retrieval are bounded and lossy; older details outside retained sources/keyword matches may need restatement. Current active-session HTTP reads still return that session's full transcript; plan/session/report listings and inference/memory selection are bounded. There is no vector search, semantic LLM summary, cross-plan model reasoning or automatic fact merge.

A new discovery starts fresh authoritative knowledge in the same plan; it does not automatically consolidate every past session. Old sessions are explicitly resumable. Cross-plan comparison is a labelled side-by-side confirmed-requirements view, not a generated consultancy report. Account defaults are a small foundation, not a client profile. Clearing them retains only revision/key metadata with an empty value. No destructive plan deletion is provided. Full mobile keyboard/accessibility/load/security penetration testing remains future work.

Next: explicitly configure an available model and review account free/paid state, run the bounded synthetic live harness and manually grade reference resolution, constraint retention, extraction/confirmation, concision and unsupported claims. Repair observed model failures before increasing inference volume or adopting semantic summary generation. Then test real mobile keyboards/accessibility and plan/session pagination under realistic history volumes.

## Exact startup and verification commands

From `/Users/keenosmith/Programming/kailor`, for this existing installation:

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Existing frontend/API servers were reused after detecting their ports already occupied; a duplicate startup was stopped automatically without replacing them. Open `http://127.0.0.1:5173/workspace` for founder access or resume an existing local guest preview. API health: `http://127.0.0.1:5050/api/health`. No credential change/reseed is required.

```bash
npm run typecheck
npm test
npm run evaluate
npm run build
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run db:migrate
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run evaluate:live
```

Only create `kailor_test` with the documented `createdb` command if it does not already exist. Never reset/reseed development data. Optional live configuration keeps existing server-only names: `AI_PROVIDER=cloudflare`, `AI_ALLOW_REMOTE=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct-fp8`, `AI_MAX_CALLS_PER_SESSION=5`, `AI_MAX_CALLS_PER_DAY=20`, `AI_MAX_OUTPUT_TOKENS=600`, `AI_TIMEOUT_MS=15000`. History defaults stay 12 messages/12000 characters initially. Verify account billing/free allocation separately before opting in; do not paste secrets or client data into source/test artifacts.

## Files created and modified

- Modified: `.cache/qa/iteration004/acceptance-api.json`
- Modified: `.cache/qa/iteration004/acceptance-matrix.json`
- Modified: `.cache/qa/iteration005/intelligence.json`
- Modified: `.cache/qa/iteration005/learning-api.json`
- Modified: `.cache/qa/iteration006/conversation.json`
- Modified: `.env.example`
- Modified: `.gitignore`
- Modified: `README.md`
- Modified: `backend/package.json`
- Modified: `backend/prisma/schema.prisma`
- Modified: `backend/src/ai.ts`
- Modified: `backend/src/answer-mutation.ts`
- Modified: `backend/src/app.ts`
- Modified: `backend/src/config.ts`
- Modified: `backend/src/context-extraction.ts`
- Modified: `backend/src/contextual-intelligence.ts`
- Modified: `backend/src/conversation-guidance.ts`
- Modified: `backend/src/discovery-planner.ts`
- Modified: `backend/src/evidence-policy.ts`
- Modified: `backend/src/generated/prisma/browser.ts`
- Modified: `backend/src/generated/prisma/client.ts`
- Modified: `backend/src/generated/prisma/commonInputTypes.ts`
- Modified: `backend/src/generated/prisma/internal/class.ts`
- Modified: `backend/src/generated/prisma/internal/prismaNamespace.ts`
- Modified: `backend/src/generated/prisma/internal/prismaNamespaceBrowser.ts`
- Modified: `backend/src/generated/prisma/models.ts`
- Modified: `backend/src/generated/prisma/models/AdminUser.ts`
- Modified: `backend/src/generated/prisma/models/AiUsageRecord.ts`
- Modified: `backend/src/generated/prisma/models/Assessment.ts`
- Modified: `backend/src/generated/prisma/models/AuditEvent.ts`
- Modified: `backend/src/generated/prisma/models/AuthSession.ts`
- Modified: `backend/src/generated/prisma/models/CaseIntelligenceRecord.ts`
- Modified: `backend/src/generated/prisma/models/ConversationMessage.ts`
- Modified: `backend/src/generated/prisma/models/CostEstimate.ts`
- Modified: `backend/src/generated/prisma/models/DiscoveryAnswer.ts`
- Modified: `backend/src/generated/prisma/models/DiscoverySession.ts`
- Modified: `backend/src/generated/prisma/models/Evidence.ts`
- Modified: `backend/src/generated/prisma/models/Recommendation.ts`
- Modified: `backend/src/generated/prisma/models/ReportSnapshot.ts`
- Modified: `backend/src/generated/prisma/models/ScenarioTemplate.ts`
- Modified: `backend/src/generated/prisma/models/Service.ts`
- Modified: `backend/src/generated/prisma/models/SimulationRun.ts`
- Modified: `backend/src/generated/prisma/models/Subject.ts`
- Modified: `backend/src/guest.ts`
- Modified: `backend/src/knowledge-conflicts.ts`
- Modified: `backend/src/session-service.ts`
- Modified: `backend/tests/contextual.integration.test.ts`
- Modified: `backend/tests/integration.test.ts`
- Modified: `backend/tests/reliability.integration.test.ts`
- Modified: `docs/api/API_REFERENCE.md`
- Modified: `docs/architecture/ARCHITECTURE.md`
- Modified: `docs/architecture/DATA_MODEL.md`
- Modified: `docs/case-library/CASE_INTELLIGENCE.md`
- Modified: `docs/deployment/LOCAL_SETUP.md`
- Modified: `docs/discovery/DISCOVERY_ENGINE.md`
- Modified: `docs/frontend/DESIGN_SYSTEM.md`
- Modified: `docs/intelligence/INTELLIGENCE_DESIGN.md`
- Modified: `docs/testing/TESTING_STRATEGY.md`
- Modified: `frontend/src/App.tsx`
- Modified: `frontend/src/Conversation.tsx`
- Modified: `frontend/src/SessionPage.tsx`
- Modified: `frontend/src/Workspace.tsx`
- Modified: `frontend/src/api.ts`
- Modified: `frontend/src/styles.css`
- Modified: `scripts/evaluate-live.ts`
- Modified: `scripts/evaluate.ts`
- Modified: `shared/src/index.ts`
- Created: `backend/prisma/migrations/202610150001_plans_and_memory/migration.sql`
- Created: `backend/src/generated/prisma/models/AccountPreference.ts`
- Created: `backend/src/generated/prisma/models/AccountSettings.ts`
- Created: `backend/src/generated/prisma/models/ConversationSummary.ts`
- Created: `backend/src/generated/prisma/models/Plan.ts`
- Created: `backend/src/generated/prisma/models/PlanActionProposal.ts`
- Created: `backend/src/personal-memory.ts`
- Created: `backend/src/plan-routes.ts`
- Created: `backend/src/plan-service.ts`
- Created: `backend/src/plans-evaluation.ts`
- Created: `backend/src/turn-intent.ts`
- Created: `backend/tests/memory.test.ts`
- Created: `backend/tests/migration.integration.test.ts`
- Created: `backend/tests/plans.integration.test.ts`
- Created: `data/evaluations/conversations.ts`
- Created: `docs/decisions/009-plan-ownership-and-lifecycle.md`
- Created: `docs/decisions/010-personal-memory-authority.md`
- Created: `docs/decisions/011-versioned-memory-lifecycle.md`
- Created: `docs/decisions/012-explicit-cross-plan-operations.md`
- Created: `docs/decisions/013-plan-aware-model-routing.md`
- Created: `docs/iterations/007-conversational-memory-and-plans.md`
- Created: `frontend/src/Plans.tsx`

Ignored local verification artifacts:

- `.cache/qa/iteration007/conversations.json`
- `.cache/qa/iteration007/live-inference.json`
- `.cache/qa/iteration007/verification.json`
- `.cache/qa/iteration007/browser-comparison-desktop.png`
- `.cache/qa/iteration007/browser-comparison-mobile.png`
- `.cache/qa/iteration007/browser-comparison-tablet.png`
- `.cache/qa/iteration007/unit.log`, `integration.log`, `evaluate.log`, `typecheck.log`, `build.log`
