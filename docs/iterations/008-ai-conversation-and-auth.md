# Iteration 008 — conversation, accounts and opaque controls

## Delivered and verified

This iteration connects the revised interface to the existing session, plan, evidence, memory, assessment and authentication services. Section 44 overrides all earlier glass directions. Kai was inspected locally as a read-only reference before visual changes; its cream/charcoal palette and quiet typography informed kailor, while its translucent surfaces and oversized pills were excluded.

| Area                | Result                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversation layout | A constrained dynamic-viewport shell, one internal transcript scroller and anchored auto-growing composer. No visible depth selector.                                                                                     |
| Character           | Exact existing `public/mascot/other/kailor-sitting.png`; contained, static and large on desktop/tablet, smaller on mobile.                                                                                                |
| Assistant identity  | Existing neutral head reserved beside every assistant message; author reads kailor. One local-provider notice survives reload.                                                                                            |
| Confirmation        | Compact confirm/edit/dismiss controls attach to the assistant following their source user turn. No bottom-of-page evidence form.                                                                                          |
| Contextual actions  | Suggestions, separate-plan proposals and readiness actions sit in the transcript. Preparing an assessment does not navigate.                                                                                              |
| Navigation          | Session page transitions use opacity only; Change plan opens a native, constrained dialog with focus handling.                                                                                                            |
| Discovery           | Existing adaptive engine, four pathways, supplied changing poses, answers and explicit analysis navigation retained; heading/control spacing reduced.                                                                     |
| New conversation    | Fresh discovery/session within the current plan; previous sessions, reports and scoped drafts remain available. It opens Conversation when invoked there.                                                                 |
| Clear conversation  | Explicit confirmation; messages are retained but hidden and excluded from model context, summaries superseded, pending evidence/proposals retired. Confirmed facts, knowledge revision, reports and audit history remain. |
| Authentication      | Dedicated `/sign-in` and `/create-account`; Intro links work; refresh and protected deep links resume after login. Blank email, password-manager autocomplete, visible errors/focus and logout.                           |
| Authorization       | New accounts are members. Founder-only cases, scenarios, personas, simulations and invitation issuance require admin middleware. Member plan/session ownership checks remain enforced.                                    |
| Registration        | Invite-only by default; email-bound, hashed, seven-day, single-use invitations. Founder Workspace can issue a code for private sharing. No email is sent automatically.                                                   |
| Styling             | Opaque cream/paper surfaces, compact shared controls, visible keyboard focus, 44px mobile/coarse-pointer targets, reduced functional headings/gaps. No backdrop filters remain.                                           |

## Files and architecture

Frontend changes cover `App.tsx`, new `Auth.tsx`, `Intro.tsx`, `SessionPage.tsx`, `Conversation.tsx`, `Plans.tsx`, `Workspace.tsx`, `Analysis.tsx`, `api.ts`, `Discovery.tsx` and `styles.css`. The supplied image files are unchanged. The sitting image is used directly so conversation processing cannot change its pose.

Backend changes cover `auth.ts`, `app.ts`, `config.ts`, `ai.ts`, `session-service.ts`, `plan-routes.ts`, the additive Prisma schema/migration and generated client. Shared Session typing adds the transcript visibility flag. `scripts/preserve-founder.ts` preserves only an already-existing, non-guest account matching configured `ADMIN_EMAIL`; it never creates an account. Existing private records, ownership, reports, evidence and passwords remain intact.

Migration `202610150002_accounts_and_invites` adds member-default roles, a case-insensitive unique email index, AccountInvite and `ConversationMessage.hiddenFromTranscript`. The migration itself grants nobody admin access. `npm run db:migrate` applies it and runs the guarded configured-founder preservation step. Applied successfully to local development and isolated test databases without resetting or reseeding either database. If legacy emails collide under case folding, the unique-index migration fails safely for manual reconciliation rather than merging accounts.

The first migration proposal was rejected by automatic approval review because it backfilled every non-guest account as an administrator. That proposal was replaced before execution. The applied version preserves only the configured founder; other old accounts default to members.

PostgreSQL/Prisma, provider-neutral AiProvider, authoritative service mutations, immutable assessment/report snapshots, source-grounded evidence, knowledge revisions, cross-plan isolation, explicit comparisons, versioned summaries and bounded retrieval remain. Clear context increments activity revision under the session lock, rebuilds the deterministic projection and preserves knowledge revision. Future retrieval and summaries filter excluded messages, preventing old conversational content from silently returning.

## Cloudflare configuration and live evidence

Credentials were already present in the ignored root `.env`, with `AI_PROVIDER=cloudflare` and `AI_ALLOW_REMOTE=true`. Presence was inspected without printing either credential. Authentication succeeded against the real provider. No token was created, billing enabled, credential committed or third-party proxy added.

The primary model is now `@cf/meta/llama-3.3-70b-instruct-fp8-fast` in the default configuration, example and local ignored environment. It supports JSON mode and a documented 24,000-token context window. It is a practical single-model choice for instruction following and structured conversation, with higher inference cost than the 8B option. The bounded diagnostic observed a valid JSON-mode response in roughly 5.7 seconds; this is a sample, not a latency guarantee or broad model benchmark. [Official model documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/).

Workers AI currently includes 10,000 free neurons daily; the selected model is outside the documented paid-only model list. Free-plan limits reject excess usage; local call limits are additional safeguards and are not a neuron meter. No billing settings were changed. [Official pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

The existing adapter now requests JSON mode and accepts either a JSON string or already-decoded object in `result.response`. It still validates the schema, reply claims, latest-turn quotes, option values, hypothetical facts and unsupported pricing. Safe natural-language replies and proposed state changes are validated separately: an invalid extraction batch is discarded and logged by count, without discarding a safe answer. Unsafe replies and transport/schema failures still use the honest local fallback. [Official JSON mode](https://developers.cloudflare.com/workers-ai/features/json-mode/).

Natural corrections can generate grounded replacement proposals, which remain unconfirmed. The provider receives pending context and instructions to distinguish clarification from acceptance. Short ambiguous yes/no replies must not silently accept sensitive or material requirements. Explicit confirm/edit/dismiss remains authoritative. Unit coverage verifies a natural diary clarification; live responses correctly distinguished WhatsApp contact from paper-diary records. Some live extractions paraphrased or quoted unrelated context and were discarded. This is a quality limitation, not permission to relax grounding.

Live synthetic evaluations were bounded, used only the isolated `_test` database, and used per-process limits of 600 output tokens, five calls/session, twenty/day and a 25-second timeout. Initial runs exposed response-object and extraction problems. After fixes, the final three-turn natural conversation returned **3/3 Cloudflare responses**, with persisted message pairs and completed usage records. It covered an inspection workflow, a natural diary correction and an offline conflict-resolution explanation. An earlier 70B turn produced a validated unconfirmed website-preference proposal. Existing assessment-readiness and immutable-report checks passed separately.

Ignored evidence: `.cache/qa/iteration008/live-inference.json`, `live-inference-natural.json`, `live-before-separate-validation.json`, `provider-probe.json`, and corresponding logs. These contain synthetic evaluation material, not token values. Broad live A–Z conversational quality, long-history reference accuracy and every hypothetical domain were **not** established by this small run. No further remote evaluation was left running.

## Authentication policy and operations

`REGISTRATION_POLICY=invite` is the default. `closed` disables signup. `public` exists as an explicit deployment choice requiring a separate abuse/security review; it is not enabled here. Successful signup always creates `role=member`, regardless of submitted fields. Strict input schemas reject extra role fields. Invites are consumed atomically in the same transaction as account creation; duplicate/case-variant email or concurrent reuse rolls back without losing a valid unused invitation. Signup errors avoid exposing which email already exists.

Passwords use the existing salted scrypt implementation. Signup requires 12–128 characters. Login accepts existing passwords, normalizes case-insensitive email lookup, keeps generic failure responses and uses hashed random session tokens with eight-hour expiry. Cookies remain HttpOnly, SameSite Strict, Secure in production, scoped to `/api`. Same-origin mutation checks, login/signup rate limits and ownership guards remain. A 401 on an authenticated page returns to Sign in with an application-local return path. Founder controls are protected by server role checks, independently of UI visibility. Guests remain local-only and have no private/founder privileges.

Email verification and self-service password recovery are **not implemented/configured**. Do not claim an email was sent. Interim onboarding: the founder verifies the intended recipient out of band, issues an email-bound invitation in Workspace, shares it privately, and the recipient sets their own password. Account recovery currently requires contacting the founder; a verified recovery process and session revocation procedure are required before a wider launch. No automated recovery flow is simulated.

## Validation results

- `npm run typecheck`: pass.
- `npm test`: **274 tests, six files, pass** (baseline: 271).
- `DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration`: **133 tests, six files, pass** (baseline: 124).
- `npm run evaluate`: pass; existing persona, reliability, contextual/intelligence and 28 conversation scenarios remain.
- `npm run build`: pass.
- `git diff --check`: pass.

Ordinary unit/integration commands explicitly force mock mode and bounded call budgets so a developer's active `.env` cannot unexpectedly enable live inference during tests. Only `evaluate:live` uses the opt-in live configuration.

New coverage includes actual PostgreSQL invited signup, member-default role, founder-only routes, owner isolation for context clearing, invitation email binding/expiry/reuse/concurrent consumption, email normalization, weak passwords, origin checks, generic failures, logout/expiry and login/signup rate limiting. Clear-context tests preserve confirmed facts, knowledge revision and report content, retain excluded messages, return empty old-message retrieval and reject stale revisions. The migration test verifies old passwords/transcripts/evidence/reports alongside member-default roles and visible old messages. Provider tests cover object-shaped JSON responses, useful replies surviving invalid extraction, and natural pending clarification.

### Browser evidence

Introduction, Sign in, Create account, regular Workspace/PlanManager, Discovery, Conversation, populated Canvas and prepared Analysis were visually inspected at **1440×900, 900×820 and 390×844**. Additional Conversation checks used **1280×800 and 1024×700**. No horizontal overflow or active backdrop filter was found in the recorded page matrix. Screenshots and geometry are under `.cache/qa/iteration008`; `responsive-matrix.json` records actual viewport dimensions rather than requested dimensions alone.

Desktop and mobile each exercised **22 messages** through the real UI. Desktop document height stayed 800px while transcript scroll height grew from 602px to 2247px. Across all eleven sends, the sitting image bounds and composer bounds were identical. At 390×844, the document stayed 390px wide and 844px high, the composer bottom was 828px, and all eleven assistant messages had a head avatar. Compact laptop document height stayed 700px and composer bottom 684px. Inline evidence, suggestions, readiness and plan actions remained inside the transcript.

Browser flows verified new conversation stays within its plan, clear cancel retains the active draft, explicit clear removes visible history, invited signup reaches a regular workspace, member plan creation, session refresh, plan dialog close/focus, logout, protected-session redirect and return to that exact session after login. Preparing an assessment stayed on Conversation until Explore the analysis was clicked. Populated report/Canvas and empty states were inspected. Existing Discovery paths and mascot transitions remain; no new artwork was introduced.

Screenshots at dimensions larger than the host panel can be visually clipped by the capture surface; DOM geometry records the requested layout. The 1280×800 and mobile proofs show the composer fully. Physical iPhone/Android keyboard behavior, formal assistive-technology auditing, browser-specific virtual-keyboard viewport quirks and production deployment are **not verified**. No claim of production readiness is made.

## Startup and founder actions

For an already-configured local checkout:

```sh
npm run db:generate
npm run db:migrate
npm run dev
```

Do not reset/reseed an existing database. Existing local servers were reused for browser testing. Keep `.env` ignored. Verify `ADMIN_EMAIL` matches the existing founder account before migrating another environment. Keep invite-only registration, verify production HTTPS/origin/cookie settings and complete backup/migration rehearsal and recovery planning before deployment.

For a new Cloudflare environment, use the dashboard's Workers AI → Use REST API → Create a Workers AI API Token flow, scope the token to the intended account, and save it privately in `CLOUDFLARE_API_TOKEN`; place the account ID in `CLOUDFLARE_ACCOUNT_ID`. The documented custom-token permissions are Workers AI Read and Edit. Select the model above, retain explicit remote opt-in and bounded limits, restart the API, and run a bounded synthetic evaluation. Do not paste a token into chat, source code or a report. No credential setup is currently blocked in this checkout. [Official REST setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/).

No commit, staging, push, merge, deployment, history rewrite or other-repository modification was performed.

## Explicit completion categories

**Implemented and tested:** opaque compact frontend, stationary desktop/mobile chat, supplied sitting/head artwork, inline decisions, drafts and keyboard behavior, new/clear conversation, invited signup/login/logout, member/founder server boundaries, additive migration, bounded real Cloudflare responses, invalid-proposal rejection, memory/report preservation and desktop/tablet/mobile page layouts. A 20-line draft restored after reload, grew only to 144px and scrolled internally; Shift+Enter retained a newline and Enter submitted. Intro keyboard progression and authenticated Start Discovery were exercised.

**Implemented but not fully tested:** founder invitation form browser interaction (its API is integration-tested), alternative closed/public registration policies, all generated follow-up variants, broad live long-history conversational quality, formal screen-reader behavior and physical-device virtual keyboards. These are not inferred from passing mock evaluations.

**Blocked by external credentials:** none in this checkout. Existing Cloudflare credentials authenticated successfully. Other deployment environments need their own authorized configuration.

**Not implemented:** email verification, self-service password recovery, production deployment, native mobile packaging, paid billing activation and new character artwork. Wider public registration remains disabled by default.

**Before deployment:** confirm founder identity and HTTPS/origin/cookie configuration; rehearse backups/additive migration; establish verified recovery and email delivery; perform physical mobile and accessibility checks; review broader live conversational quality and usage limits; then obtain the founder's final visual review.

## File inventory

Generated Prisma files reflect the additive schema. Historical tracked QA snapshots were restored after test execution; fresh evidence remains under ignored iteration008. The local ignored `.env` model selection changed without exposing credentials. Synthetic browser accounts/plans and isolated live evaluation sessions remain clearly synthetic for review; no real customer records were reset.

```text
.env.example
README.md
backend/package.json
backend/prisma/migrations/202610150002_accounts_and_invites/migration.sql
backend/prisma/schema.prisma
backend/prisma/seed.ts
backend/src/ai.ts
backend/src/app.ts
backend/src/auth.ts
backend/src/config.ts
backend/src/generated/prisma/browser.ts
backend/src/generated/prisma/client.ts
backend/src/generated/prisma/commonInputTypes.ts
backend/src/generated/prisma/internal/class.ts
backend/src/generated/prisma/internal/prismaNamespace.ts
backend/src/generated/prisma/internal/prismaNamespaceBrowser.ts
backend/src/generated/prisma/models.ts
backend/src/generated/prisma/models/AccountInvite.ts
backend/src/generated/prisma/models/AdminUser.ts
backend/src/generated/prisma/models/ConversationMessage.ts
backend/src/plan-routes.ts
backend/src/session-service.ts
backend/tests/accounts.integration.test.ts
backend/tests/adaptive.test.ts
backend/tests/contextual.integration.test.ts
backend/tests/contextual.test.ts
backend/tests/conversation.test.ts
backend/tests/integration.test.ts
backend/tests/migration.integration.test.ts
backend/tests/reliability.integration.test.ts
backend/tests/reliability.test.ts
backend/tests/unit.test.ts
docs/api/API_REFERENCE.md
docs/architecture/ARCHITECTURE.md
docs/architecture/DATA_MODEL.md
docs/decisions/014-accounts-and-opaque-conversation.md
docs/deployment/LOCAL_SETUP.md
docs/discovery/DISCOVERY_ENGINE.md
docs/frontend/DESIGN_SYSTEM.md
docs/intelligence/INTELLIGENCE_DESIGN.md
docs/iterations/008-ai-conversation-and-auth.md
docs/testing/TESTING_STRATEGY.md
frontend/src/Analysis.tsx
frontend/src/App.tsx
frontend/src/Auth.tsx
frontend/src/Conversation.tsx
frontend/src/Discovery.tsx
frontend/src/Intro.tsx
frontend/src/Plans.tsx
frontend/src/SessionPage.tsx
frontend/src/Workspace.tsx
frontend/src/api.ts
frontend/src/styles.css
package.json
scripts/evaluate-live.ts
scripts/preserve-founder.ts
shared/src/index.ts
```
