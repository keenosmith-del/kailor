# Iteration 011 — project workspace

## Architecture audit (before implementation)

The route tree currently exposes Introduction and authentication, protected `/workspace`, `/plans`, `/plans/:planId`, `/sessions/:id/:view`, and guest `/preview` equivalents. Workspace is a dashboard mixing PlanManager and founder tools. SessionPage owns session loading, optimistic revisions, Discovery/Conversation/Canvas/Analysis rendering, a top navigation and PlanNavigation. Conversation uses a sitting mascot, a right-hand message column, a bottom-following scroll container and persisted session-scoped drafts.

`Plan` already represents an owned project: title, description, archive/revision, lastSessionId and many DiscoverySessions. AccountSettings stores the active selection with optimistic concurrency. Each DiscoverySession holds guided answers, messages, confirmed/inferred evidence, derived context/planner state, versioned summaries and assessments. Assessment/ReportSnapshot preserve immutable analyses, deduplicated by knowledge revision. Existing plan endpoints support selection, renaming, session history, report history, explicit comparison and account preferences. These entities and API names will remain; no migration or historical data rewrite is needed.

Chat and Discovery already write through the same evidence/answer services and readiness gate. Analysis can use confirmed Chat evidence without completing guided Discovery. New sessions currently start with empty knowledge; personal memory is scoped to the current session, while explicit account preferences are shared. Project continuity must therefore reuse the active session for navigation and carry forward confirmed knowledge when explicitly starting another conversation. Historical reports can be retrieved by project, but PDF export currently supports only the latest session report. Add owner-scoped historical PDF support rather than exporting the wrong version.

Guest authentication uses a separate HttpOnly cookie and guest principal, existing Plan/Session ownership, deterministic inference, and seeded reference knowledge only. Guest entry currently creates another Plan on every POST; this will become idempotent resume under the guest owner lock. Existing guest projects will remain intact and accessible through their saved URLs, with only the selected project exposed in the new sidebar and resumed by entry. No automatic transfer to an account exists; keep guest work under its independent cookie and explain that limitation rather than silently changing ownership.

The adaptive Discovery composition and scene animations will be retained. Canvas is a validated recommendation projection, not a board. Report sections and export remain. General consulting knowledge comes from `data/scenarios` (including nails) and reviewed sanitized cases; no private data will be promoted into this library. Existing account preferences offer explanation style and implementation default. Founder simulations, invitations and case review must remain available only through a protected founder destination.

Visual sources inspected: Intro.tsx/Intro.css, EntryButton.css, Auth.tsx/Auth.css, global.css, layout.css, Footer.css and all session view CSS. Use their cream/paper palette, charcoal, Helvetica, light `#fffefc` pill and restrained transitions, scoped to the application so Introduction/authentication stay unchanged.

## Intended mapping

- ApplicationWorkspace owns navigation and project selection; ApplicationSidebar provides an overlay drawer, icon rail and bottom profile. The page does not resize when opened.
- Canonical account `/app/:id/:view` and guest `/preview/:id/:view` use `chat`, `discovery`, `canvas`, `analysis`, `sources`, `settings`, `account`. Entry routes without an id restore the selected/recent session; `/workspace` becomes a Chat entry alias. Old session/conversation/report links remain compatible.
- Keep SessionPage as the shared data controller beneath the stable shell. Chat/Discovery stay in the same active session; page switches never create work. Explicit new conversations create another session in the same project with confirmed context copied with provenance; prior transcripts and reports stay intact.
- Reuse Conversation's real submission/evidence confirmations, replacing its composition and scroll-follow behavior with centered messages, an optimistic user turn and anchored thinking/response area.
- Use real project report history for Analysis and Sources; preferences for Settings; existing account identity for Account. Uploaded-file ingestion and secure guest transfer are unsupported and will be documented without fake controls.

## Implementation and verification

### Shared application and entry

`ApplicationWorkspace` is the stable shell. `ApplicationSidebar` contains the horizontal ellipsis trigger, desktop icon rail with tooltips, cream overlay drawer, scrollable project list and bottom profile. Opening it locks background scrolling, makes the page inert, traps keyboard focus and restores focus on close. Escape, backdrop and navigation close it; its 250ms animation never resizes the page. The rail is hidden below 701px. Session view fades and personal-page fades retain the header and navigation, with existing reduced-motion handling.

Signed-in default entry is `/app/chat`; `/workspace` redirects there. With no projects, the first prompt creates a real project and is submitted through existing Chat. Existing users resume the saved selection or a recent available project. `/app/:id/:view` and `/preview/:id/:view` share all seven destinations. Here `id` remains a DiscoverySession/conversation ID, not a Plan ID. Existing `/sessions/:id/conversation` and `/sessions/:id/report` links resolve to Chat and Analysis. Legacy `/plans` utilities remain compatible; the former dashboard and founder tools are restricted to `/founder` and admin accounts.

Project creation, paginated listing, switching and renaming reuse Plan endpoints, creation keys and optimistic revisions. Conversation history uses the existing session catalogue; New conversation creates a session in the same project. New discovery retains the existing fresh-session behavior. Guest entry resumes under an owner lock instead of silently making another project. Extra guest project creation and proposal acceptance are rejected server-side. Older guest records are neither deleted nor merged.

### Chat, Discovery and context

Chat uses an 820px maximum column, head mascot empty state and assistant avatars, restrained user surfaces and a multiline bottom composer. The sitting asset stays in the repository but is absent from Chat. A submitted user turn appears immediately with a neutral animated thinking row while the real service runs. Scroll geometry anchors the latest user turn near the transcript's top and retains the response beginning; wheel, touch, pointer or history keyboard interaction disables automatic anchoring. The composer and single shared footer occupy separate layout space. Existing drafts, inline evidence confirmation/edit/dismiss, conflicts, contextual suggestions, explicit analysis preparation and clear-context confirmation remain operational.

Discovery's question/mascot composition, adaptive planner and animations remain. Application-scoped pills, rail-aware margins and existing responsive layout integrate it with the shell. Chat and Discovery keep the same active session on page changes. Canvas continues to use validated recommendations and the existing insufficient-context state. Analysis generation stays explicit and uses the existing shared evidence/readiness policy; neither Discovery completion nor page navigation generates it automatically.

New conversations opt into `carryContext: true`. The backend copies the selected conversation's guided answers (including response states) and active confirmed evidence, recording inherited session/evidence provenance. It does not copy pending claims, the transcript or old reports. The old conversation remains available. Context is a branch from the selected conversation, not an automatic union of conflicting facts from every conversation. Bounded retrieval can include three relevant earlier messages within the same project and owner, and the latest saved assessment summary when the user asks about analysis/report/recommendations. These are marked historical references, never confirmed facts. Existing summary lifecycle, account preferences, privacy screening, provider selection and inference budgets remain enforced. Clearing a transcript excludes it from future sibling retrieval; confirmed knowledge and saved reports stay intact. Scenario knowledge, including nail-business references, is unchanged.

### Analysis, Sources, settings and account

`ProjectReports` lists actual immutable snapshots across the current project's conversations, with pagination, complete historical sections, a Chat link and PDF export for the selected version. Generating an analysis refreshes the history even when its session revision does not change. The new historical PDF route verifies both owner and project; it cannot export a different project's report. Existing latest-session exports remain compatible. Repeated assessment at unchanged knowledge revision reuses the existing snapshot; changed knowledge produces a new assessment without overwriting prior content.

Sources reuses those generated reports. There is no fabricated upload interface. Settings reads/writes the existing explanation-style and implementation-default preferences using their revisions. Account shows actual profile/authentication status and explains temporary guest work. Members do not receive founder links or tools. The introduction, authentication compositions, mascot assets and footer component were preserved.

### Changed files

- `frontend/src/App.tsx`, `components/PageTransition/PageTransition.tsx`: shared routes, founder boundary and stable page fades.
- `frontend/src/components/ApplicationSidebar/ApplicationSidebar.tsx` and `.css`: shared navigation, projects, profile and accessible overlay.
- `frontend/src/pages/Application/ApplicationWorkspace.tsx` and `.css`, `useProjects.ts`: project/session shell, entry/resume and project operations.
- `frontend/src/pages/Application/ConversationHistory.tsx`, `ProjectReports.tsx`, `PersonalPages.tsx`: real conversation/report history, Sources, Settings and Account.
- `frontend/src/pages/Conversation/Conversation.tsx` and `.css`, `pages/SessionPage/SessionPage.tsx`: centered Chat, anchored turns and integration of existing session capabilities.
- `frontend/src/services/api.ts`, `useDiscoveryEntry.ts`, `pages/Auth/useAuthentication.ts`: canonical links, historical downloads and entry destinations.
- `backend/src/app.ts`, `guest.ts`, `session-service.ts`: account resume endpoint and serialized guest/account entry.
- `backend/src/plan-service.ts`, `plan-routes.ts`, `personal-memory.ts`: confirmed context carry, guest project limit, scoped historical PDF and bounded project retrieval.
- `backend/tests/workspace.integration.test.ts`, `integration.test.ts`, `contextual.test.ts`, `memory.test.ts`, `backend/package.json`: workspace coverage, updated guest resume expectation and correction of two pre-existing moved draft-module imports.
- README and architecture/API/design/testing documents: current behavior, contracts and validation.

### Verification

- `npm test`: 274 unit/provider-contract tests passed.
- `npm run typecheck` and `npm run build`: passed; final checks are recorded with this iteration.
- Isolated PostgreSQL integration suite: 137 tests, including three new workspace tests covering concurrent guest resume/limits, account resume, copied confirmed knowledge, prior conversation/report memory, clear-context semantics, cross-owner/project isolation, immutable versions and historical PDFs.
- Browser verification used a temporary member account and the existing isolated guest authority. Verified default empty Chat, immediate optimistic turn/thinking followed by an actual backend response, creation/rename/switch, new conversation and reopening history, draft persistence across Chat/Discovery, guest report listing, sidebar navigation/Escape/focus/scroll lock, and Settings. Mobile 390×844 and tablet 768×1024 had no horizontal overflow. Composer/footer bounds were separate on mobile and desktop. The temporary viewport override was reset afterwards.
- Automated suites use mock mode and a dedicated `_test` database. They do not establish broad live-model quality. One provider-contract run fell back locally because the existing sensitive-data screen classified its synthetic context as sensitive; the final full rerun passed without changing that screen or substituting a real network call.

### Remaining limits and operations

No schema change, migration, reseed, dependency addition, staging, commit or push is required. Existing records and report snapshots are preserved. Uploaded PDF/CSV ingestion and secure guest-to-account transfer have no backend support and remain explicitly unavailable. Guest work uses a separate 24-hour cookie, existing deterministic guidance and seed references; signing in does not transfer ownership. Older guest project URLs remain usable while their cookie is valid, but the sidebar presents one selected temporary project. Permanent guest recovery/retention cleanup remains outside this iteration.

Project creation and selection use the existing paginated API; active selections beyond the first page are loaded explicitly. Historical conversation retrieval is bounded, not exhaustive semantic search or automatic cross-project recall. Existing archive/restore/comparison utilities and server APIs remain available through legacy routes. Browser viewport checks do not establish physical mobile keyboard or formal screen-reader behavior.
