# Iteration 006 — Conversational intelligence, context and experience

Implemented in the existing local repository on 15 October 2026. No branch, worktree, staging, commit, push, deployment, database reset or development reseed was performed. Initial working tree was clean.

The previous provider discarded conversation history; local replies usually requested confirmation without a useful next question, and Conversation lacked an assessment preparation action. This iteration connects bounded conversation memory, conservative proposals, contextual replies and explicit assessment preparation through the existing shared discovery pipeline.

## Architecture and context

`backend/src/conversation-context.ts` selects ordered user/assistant messages. Defaults: twelve recent messages, twelve thousand characters; configuration names are `AI_CONTEXT_RECENT_MESSAGES` and `AI_CONTEXT_MAX_CHARACTERS`. Full-message selection stops at the size boundary. The current user message is appended once. Caller-supplied system roles are discarded.

Older history is represented only when its range is at least as long as the configured window. A deterministic six-excerpt digest preserves relevant goal/constraint/decision/question/alternative wording, source IDs, covered range and truncation flags. Each excerpt is bounded to 400 characters and labelled unconfirmed. The summary is rebuilt on demand, without extra inference calls or database copies. It is a lossy digest, not a semantic guarantee that every old detail is retained. Underlying history is never deleted. See [ADR 008](../decisions/008-bounded-conversation-memory.md).

Cloudflare receives policy separately from untrusted session data: minimized confirmed answers, pending confirmations, corrections, skipped fields, shared readiness, next gap, bounded approved-reference hints and recommendation alternatives. Existing URL/budget/timing field omission and local sensitive-context routing remain. No private source sessions, case titles or credentials are intentionally included. Free-text descriptions can still contain identifiers, so regex detection alone is not a privacy guarantee. Existing founder authorization, opt-in and manual sanitization remain required.

The existing provider-neutral interface, REST endpoint, model name, output token limit, timeouts, atomic session/daily reservations and usage/failure records remain. Accepted relevant conversational turns can use the authorized provider even when they contain no new facts. Off-topic requests, rejected input, guest sessions and sensitive contexts retain local routing. Provider errors and invalid output fall back to clearly attributed local guidance; there are no automatic retries. Reservations still count attempted/failed calls. Concurrent calls may both reserve inference before one loses the existing optimistic revision race; only one message pair persists. No claim of exactly-once remote charging is made.

## References, extraction and confirmations

Both providers receive recent history. Local fallback resolves first/second references only against an explicit numbered comparison within its bounded recent window and asks for clarification when absent. The real provider is instructed to use its history and distinguish hypothetical comparisons from decisions. Local fallback now covers a website/app comparison, greetings, casual follow-ups, summary requests, explanations, assessment requests and contextual booking alternatives. Replies normally use short paragraphs and one useful question. No hard word truncation or streaming was added; the existing validated response-size/output-token boundaries still apply.

Extraction stays separate from conversation. Current-statement clause filtering is shared with remote proposal validation. Questions, hypotheses and historical statements cannot become facts merely because a model quotes them. The nail-business phrasing now recognizes professional presentation and easier bookings. Explicit goals to let customers browse work/products also support presentation discovery. An explicit “Actually, I think a website would be enough” proposes website requested/app declined; it changes no confirmed state until accepted. No-longer booking-app requests also propose a refusal. Probabilistic or ambiguous changes still require clarification.

Confirmation retains grouped accept/reject, conflict safeguards, rejection suppression and historical evidence. A single pending proposal can be edited during confirmation through the shared strict Zod `evidenceReviewInput` contract. Edited values use the existing answer validation, transaction, ownership and revision checks; provenance records user-edited wording. The original proposal is retained inactive. Proposal metadata is presented in calmer language without confidence scores. No evidence is created for greetings, thanks, explanation requests or poem requests.

`shared/src/conversation.ts` generates typed message suggestions from pending details, latest explicit comparisons and the existing adaptive plan. Short labels describe their draft text. Clicking fills/focuses the composer for review; sending is explicit. Assessment/navigation controls are separate supported actions. Known situations no longer receive the planner’s generic starting-stage question just because chat did not supply that questionnaire field. Readiness policy itself is unchanged.

## Conversation-only assessment and preserved features

The nail-business acceptance path starts with no guided answers, proposes and confirms Instagram/WhatsApp workflow, then goals and constraints. Shared readiness enables **Prepare assessment**, followed by **Explore the analysis** and **Continue conversation**. Preparing does not navigate automatically. Analysis and Canvas consume the existing immutable snapshot and existing PDF renderer.

Existing Discovery composition, introduction, Solution Canvas, Analysis panels, PDF template, service catalogue, approved case learning/review, guest restrictions, authentication, ordinal ordering, optimistic revisions and report immutability remain. Conversation activity does not increment knowledge revision. Confirmed material scope changes stale the report while preserving the old snapshot. No schema change or new migration is needed.

## Frontend

Conversation retains the cream split composition and centralized existing static mascot poses, using thinking/readiness/completion states with existing reduced-motion crossfades. Other pages were not redesigned. Paragraph whitespace and technical strings wrap safely as React text; no HTML/Markdown injection renderer was introduced. Lists remain readable plain text.

The composer guards duplicate sends with an immediate ref as well as disabled controls. Desktop Enter submits, Shift+Enter inserts a newline, and IME/composition events do not submit. Coarse-pointer/mobile input keeps Enter for newlines. Draft clearing occurs only after a successful chat response. Errors keep the draft; activity refresh no longer replaces an in-memory unsent message. Existing thirty-minute session-storage expiration is retained. The transcript scrolls to new content only while the reader is near its bottom. Touch controls, mobile input font sizing, safe-area padding and bounded scrolling are scoped to Conversation. Processing text reflects the actual pending mutation; there are no fake phases, loading dots, artificial waits or typewriter effects.

## Executed verification

Baseline: typecheck, 228 unit tests, 14 persona evaluations, 57 reliability cases, 15 independent intelligence cases plus learning checks, and production build passed. The first database attempt failed because the local container was stopped/inaccessible in the sandbox. The existing PostgreSQL container was then started and the documented isolated test command ran successfully; all six existing migrations were already applied. Development data was not reseeded.

Final execution results are recorded below; synthetic assertions do not establish live model quality or percentage improvements.

- `npm run typecheck`: passed for all workspaces.
- `npm test`: 250 passed, five files.
- `npm run evaluate`: all 14 personas, 57 reliability cases, 15 intelligence cases, learning checks and eight new independent multi-turn scenarios passed.
- `npm run build`: passed, including Vite production output.
- Isolated PostgreSQL integration: 112 passed, three files, against `kailor_test`.
- `npm run evaluate:live` with isolated database URL: skipped, `AI_PROVIDER=mock`, remote opt-in false, credentials absent. No remote call or billing change occurred.
- `git diff --check`: passed.

The multi-turn corpus covers casual-to-portfolio, numbered website/app references including comparative cost limitations, nail-business goals and constraints, unknown offline inspection work, change of mind, out-of-scope recovery, history/hypotheses and ambiguous references. Artifacts: `.cache/qa/iteration006/conversation.json` and `live-inference.json`. Tests also cover source-range accuracy, message bounds/roles, sensitive history, provider payload shape, invalid proposals from questions and five failure modes (timeout, malformed body, 429, context rejection and authentication failure). Existing budget, authorization, injection, rejected proposal and fallback tests remain.

Database additions verify chat-only readiness/preparation, editable confirmation through HTTP, no-op freshness, evidence-backed reports, Canvas snapshot compatibility, PDF HTTP output, concurrent chat ordering/stale retries and the exact mobile-to-website correction. No guided stage answer is needed.

Actual browser checks used the in-app browser: fresh guest session → Conversation → two nail-business turns → grouped confirmation → readiness → preparation while remaining in chat → explicit Analysis navigation. A second tab submitted a stale revision: the error appeared, saved history refreshed, the draft survived and manual retry succeeded. A subsequent thanks message retained the prepared assessment. The default narrow viewport, a 390×844 mobile viewport and a 1280×900 desktop viewport were inspected. Mobile document/viewport/content width all measured 390px, with no horizontal overflow. Suggestion drafting, desktop Enter submission and a real second-option follow-up were verified. Real-device keyboard occlusion, full tablet/browser/accessibility matrices, network-offline UI simulation and browser PDF download were not tested in this iteration. PDF endpoint compatibility was tested against PostgreSQL; the unchanged PDF layout was not re-rendered for visual QA.

A new correction fixture initially failed because an app preference alone had insufficient evidence; the test now verifies that safeguard before adding a real situation and outcome. A further failure exposed missing recognition of “browse my work”; extraction now treats that explicit presentation goal as candidate credibility evidence. These are recorded failures and fixes, not live model improvements.

## Known limits and next iteration

Live Cloudflare conversation quality, real option-reference understanding, extraction recall, model conciseness and actual provider billing enforcement are unverified. Local replies remain narrow deterministic fallbacks, not general model intelligence. The local ordinal resolver requires explicit numbering in recent history. Older summaries can omit old alternatives or constraints; confirmed state remains authoritative. Terse answers that do not themselves express an extractable fact may need rephrasing in local mode. Ambiguous changes require clarification rather than silent scope replacement. There is no semantic summary model, streaming, idempotency key or exactly-once inference charging guarantee. Existing revision conflicts prevent duplicate persistence; the UI never automatically retries.

Next iteration: run the bounded synthetic live smoke with founder opt-in and manually assess the recorded multi-turn outputs, then improve observed failures before expanding providers or inference volume. Validate real mobile keyboard behavior and accessibility with devices.

## Exact local commands

From `/Users/keenosmith/Programming/kailor`, existing installations need no reseed:

```bash
docker compose up -d postgres
npm run dev
```

Web: `http://127.0.0.1:5173`; API: `http://127.0.0.1:5050/api/health`. The verification servers were left running for review.

```bash
npm run typecheck
npm test
npm run evaluate
npm run build
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run db:migrate
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run evaluate:live
```

Create `kailor_test` with the documented `createdb` command in LOCAL_SETUP only if it is absent. Never reset/reseed the development database.

For optional live smoke, configure existing server-only `.env` keys: `AI_PROVIDER=cloudflare`, `AI_ALLOW_REMOTE=true`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct`; retain `AI_MAX_CALLS_PER_SESSION=5`, `AI_MAX_CALLS_PER_DAY=20`, `AI_MAX_OUTPUT_TOKENS=600`, `AI_TIMEOUT_MS=15000`. Keep new history settings at defaults initially. Use only the `_test` command above. It issues at most three synthetic prompts, records outputs/usage/fallbacks and never enables billing. Account free-tier availability/billing settings must be checked separately before opting in; call budgets alone do not guarantee zero charges. Do not paste credentials or real client data into chat or source control.

## Files created and modified

- `.cache/qa/iteration004/acceptance-api.json`
- `.cache/qa/iteration004/acceptance-matrix.json`
- `.cache/qa/iteration005/intelligence.json`
- `.cache/qa/iteration005/learning-api.json`
- `.env.example`
- `backend/package.json`
- `backend/src/ai.ts`
- `backend/src/app.ts`
- `backend/src/config.ts`
- `backend/src/context-extraction.ts`
- `backend/src/conversation-guidance.ts`
- `backend/src/discovery-planner.ts`
- `backend/src/guest.ts`
- `backend/src/knowledge-conflicts.ts`
- `backend/src/session-service.ts`
- `backend/tests/contextual.integration.test.ts`
- `backend/tests/contextual.test.ts`
- `backend/tests/unit.test.ts`
- `docs/api/API_REFERENCE.md`
- `docs/architecture/ARCHITECTURE.md`
- `docs/case-library/CASE_INTELLIGENCE.md`
- `docs/discovery/DISCOVERY_ENGINE.md`
- `docs/frontend/DESIGN_SYSTEM.md`
- `docs/intelligence/INTELLIGENCE_DESIGN.md`
- `docs/testing/TESTING_STRATEGY.md`
- `frontend/src/Conversation.tsx`
- `frontend/src/SessionPage.tsx`
- `frontend/src/styles.css`
- `scripts/evaluate-live.ts`
- `scripts/evaluate.ts`
- `shared/src/index.ts`
- `.cache/qa/iteration006/browser-conversation-desktop.png`
- `.cache/qa/iteration006/browser-conversation-mobile.png`
- `.cache/qa/iteration006/conversation.json`
- `.cache/qa/iteration006/live-inference.json`
- `.cache/qa/iteration006/verification.json`
- `backend/src/conversation-context.ts`
- `backend/src/conversation-evaluation.ts`
- `backend/tests/conversation.test.ts`
- `docs/decisions/008-bounded-conversation-memory.md`
- `docs/iterations/006-conversational-intelligence.md`
- `shared/src/conversation.ts`

The earlier iteration QA artifacts are refreshed executions from the preserved suites. New iteration 006 artifacts contain synthetic data only. Browser screenshots record the tested desktop and mobile layouts.
