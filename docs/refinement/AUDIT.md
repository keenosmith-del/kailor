# Refinement audit — 15 October 2026

Audit completed against the existing checkout before implementation. No Git writes, database resets or replacement application.

## Existing architecture and working foundations

TypeScript npm workspaces: React 19/Vite/React Router frontend, Express 5 modular monolith, shared Zod contracts, Prisma 7/PostgreSQL. Introduction, authentication and Chat establish warm cream surfaces, restrained typography and rounded controls. ApplicationWorkspace selects projects; SessionPage coordinates the persisted discovery session across views.

Email/password registration and opaque HTTP-only cookie authentication work with member/admin boundaries, same-origin mutation checks and rate limits. **GitHub OAuth does not exist**: authentication UI explicitly disables it. Preserve this honest limitation rather than claim existing OAuth support. Guests have an isolated principal, one project and a nonrenewing 24-hour auth token. Expiration removes access; it does not physically purge database records. The guest cookie is scoped to `/api/guest`; account login cannot see it. Transfer needs an explicit authenticated guest route, not an implicit login merge.

Plan and session reads enforce ownership. Revision locks serialize mutations. New conversations are existing DiscoverySession records within a Plan, with optional confirmed-context carry. Evidence distinguishes inferred, confirmed, superseded and rejected values. Assessments and report JSON snapshots are immutable and keyed by knowledge revision. Account preferences and bounded conversation summaries already exist. Reference patterns are curated synthetic/unverified knowledge, not customer outcomes.

## Reproduced and code-confirmed gaps

- Baseline `npm test`: 274 tests pass across six files.
- Discovery's uncertain stage asks about frustrations, then existing processes. The shared readiness policy requires an operational service direction, making pure exploration impossible.
- Model provider supports Cloudflare Workers AI and deterministic local guidance only. `.env` has Cloudflare selected, remote opt-in enabled and both credentials present (values never printed). Configured quotas are 20 calls/session, 50/day. Guest routing unconditionally forces local inference; the service also excludes guest principals. This explains guest fallback even with working credentials. Provider reachability still requires an actual bounded request.
- Provider JSON/schema and quality validation are separate from proposal validation, with safe local recovery and content-free reason logs. Reply validation can reject unsupported prices. Timeouts are currently flattened into a generic transport reason.
- Extraction can recognise tools across answers but readiness checks raw tools instead of inferred signals. Technical confidence and phone management can enter the goals field. Conversational replies can be overwritten by duplicate-proposal housekeeping.
- Project context uses active-session facts, bounded history and preferences; earlier project conversations and a report summary are already retrieved; actual selected-report recommendations and uploaded sources are not included. New-conversation carry exists; no second conversation state store is needed.
- Restart currently creates a new session rather than resetting only guided answers. It is hidden from guests and lacks scope confirmation.
- Sidebar already overlays without pushing content and traps focus. Its dark active states and typography are heavy; ellipsis is on the wrong side. Conversation dropdown lives above Chat instead of under its project.
- Canvas is a card list with raw evidence, no connected workflow or selected-node panel.
- Analysis is a seven-panel carousel with a fixed index bound. Reports include internal field names, estimate enums and extensive reference warnings. Saved viewer and PDF repeat this content.
- Sources is report history; no document storage or extraction infrastructure exists. No safe binary upload should be implied. Text/CSV knowledge and supplied links can be implemented with bounded validation and ownership checks; binary PDF/DOCX ingestion requires additional extraction/security support.
- Settings persist preferences, but need clearer layout and retention disclosure. Account guest transfer is absent and accurately warns about it.

## Implementation sequence and compatibility

1. Add journey-aware discovery and exploration outcomes; retain current business evidence rules and historical definition version. Invalidate derived planner caches with a new planner version.
2. Correct conversational routing/extraction, remote diagnostics and guest configuration. Select project/report context with ownership and bounds. Retain consequential-fact confirmation.
3. Move existing conversation navigation into the sidebar. Add a revision-checked guided restart with explicit fact scope.
4. Share a customer report projection between active, saved and PDF views without changing immutable historical JSON. Add an interactive structured canvas.
5. Add bounded project resources and explicit guest transfer using additive migrations only. Refine Settings/Account and shared light styles.
6. Run unit, isolated database integration, typecheck/build and practical browser verification. Record actual results and external limitations.

No destructive migrations, reseeding of user data, credential disclosure or Git mutations are planned.
