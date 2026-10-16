# 012 — Sidebar and guest journeys

## Scope and components

Focused refinement of the existing shell; no intelligence, authentication, schema or styling-framework replacement.

- `ApplicationSidebar.tsx` / `.css`: one persistent navigation component and one page-link list. The ellipsis and icon column share a centre line. Expansion reveals labels, projects and profile controls over the page; it does not change body geometry. The same ellipsis toggles both ways at the same coordinates. Desktop retains icons when collapsed; mobile retains the brand and toggle.
- `ApplicationWorkspace.tsx`: project-creation modal inerts the unified navigation; new-conversation callbacks accept the requested project ID rather than assuming the currently displayed project.
- `ConversationHistory.tsx`: independently loads an expanded project's paginated conversations, selects that project's session through the revision-checked selection endpoint, and gives dates full accessible labels. Initial requests ignore responses after unmount or a project change.
- `GuestJourneyEntry.tsx` / `.css`, `App.tsx`, `useDiscoveryEntry.ts`: explicit guest entry and confirmation flow. Signed-in entry continues through the existing account endpoint.
- `SessionPage.tsx`, `Analysis.tsx`, `ProjectSources.tsx`: archived work stays read-only while report history, snapshot reading, reference reading and PDF exports remain operable. Archived mutation controls are disabled/hidden. An archive notice links to guest journeys or account project management for restoration.

## Navigation and accessibility

The drawer overlays a restrained backdrop. Clicking the backdrop, pressing Escape, choosing a destination, or using the ellipsis closes it. Opening locks body scrolling and makes the application body, header and footer inert. Tab and Shift+Tab wrap through visible enabled drawer controls; closing restores focus to the ellipsis and restores prior inert/overflow state. The drawer exposes a labelled modal dialog only while open. Reduced-motion users get no navigation transitions.

Projects begin collapsed. Each project's chevron independently controls its own conversation group; selecting the project is a separate action. Expansion persists while this shell remains mounted, including drawer close/reopen, and is not persisted across reloads. Active project/conversation/page indicators use text weight, icon weight and a small project marker. Titles truncate visually and retain full accessible labels/tooltips. All drawer targets are at least 44 px tall; conversation rows are 48 px. Project/conversation lists scroll independently above the bottom identity control.

Drawer hover styles use transparent backgrounds, colour and a two-pixel text movement on selected control types. There are no filled hover pills. The bottom identity disclosure contains Settings and Account, plus Sign out only for authenticated users. Guest authentication actions live on Account, preserving return-to/transfer routes without duplicating them in the drawer.

## Guest lifecycle and API

`/preview/discovery` now distinguishes:

1. **Continue current project**: opens its latest selected Chat.
2. **Open Discovery in this project**: opens its saved guided answers. Its existing guided restart still explains that Chat-confirmed facts and saved reports remain; this is not presented as an empty new project.
3. **Start a new guest journey**: opens an explicit archive confirmation with Cancel, Escape and backdrop dismissal. No write occurs until **Archive and start fresh**.

Confirmation explains that the old project becomes read-only, its conversations, answers, sources and reports remain accessible through **Archived guest journeys**, and saved PDF exports remain available until the original guest expiry. The new project receives an entirely new subject and session: no answers, messages, evidence, summaries, proposals, context caches, assessments, reports or sources are inherited. Profile preferences remain because they belong to the guest principal. Cancellation preserves the current project and returns focus after its content is no longer inert.

`backend/src/guest-journeys.ts` adds:

- `GET /api/guest/journeys`: returns the current active guest project (ID/title/revision/lastSessionId) and original token expiry, or nulls. It creates nothing, changes no selection and sets no cookie. Account cookies alone never identify guest work.
- `POST /api/guest/journeys`: strict `{ planId, revision, creationKey, consent: true }`; guest credentials and same-origin mutation checks are required. A transaction locks the guest owner and current project, rechecks unexpired guest credentials, checks ownership/revision, archives active guest work, creates an empty project/session, sets its last-session and active-project references, and records `guest.journey-started`. Retries with the same key return the same project/session; stale or foreign confirmations fail. Rate limit: ten requests/hour/IP. No deletion or cookie renewal occurs.

Existing archived-plan columns, owner relations and audit JSON are reused; no migration is required. `updatePlan` serializes with the owner and prevents restoring an archived guest project while another active one exists. Authenticated projects retain normal archive/restore behaviour. Normal guest project creation remains constrained. Old session/report references stay attached to their original project rather than becoming dangling active references.

Existing transfer semantics are preserved: explicitly transferring one project revokes all guest tokens. The entry/confirmation copy warns that this also ends access to other retained guest journeys; export first. An archived project can itself be transferred, and can subsequently be restored through account project management (`/plans`). The archive notice links there. Starting a fresh journey never renews the original 24 hours. Expiry ends access; it does not promise immediate database deletion or account recovery.

## Executed verification

- `npm test`: 291 existing backend unit tests and 8 new frontend DOM interaction tests passed.
- `DATABASE_URL=postgresql://…/kailor_test npm run test:integration`: 155 tests passed across 10 files (including seven new real-PostgreSQL guest lifecycle tests).
- `npm run typecheck`: all three workspaces passed.
- `npm run build`: shared, backend and frontend passed. After final focus/label/archive presentation changes, frontend DOM tests, all-workspace typecheck and frontend build were rerun successfully. The seven guest integration tests were also rerun after adding preference-retention assertions.
- `git diff --check`: passed. Changes remain unstaged and uncommitted. Historical tracked `.cache` files overwritten by legacy tests were restored using read-only `git show` and normal file writes.

DOM tests cover the same ellipsis toggling, one navigation list, Escape/backdrop dismissal, focus wrapping/restoration, independent project expansion, correct project/session selection, correct new-conversation project, active attributes, full project labels, guest/account profile options, first guest entry, explicit confirmation and cancellation without a POST.

Database tests cover read-only entry/cancel semantics, original expiry, consent and guest credentials, stale revision and cross-owner/account denial, concurrent idempotent confirmation, exactly one empty active project, selected-session references, retained profile preference, archived answers/sources/report/PDF, cross-project report denial, guest resumption of the new session, blocked archived writes/second active restoration, explicit archived-project transfer with existing account projects intact, and expired guest rejection. All model transports use mock/stub providers; no live Cloudflare request was made for this refinement.

Practical browser checks used an isolated synthetic guest named **Nail tech**, with a saved existing-business starting answer, on local QA API/frontend ports 5052/5175. Desktop 1440 × 900: toggle rectangle stayed `(20,16,44,44)` across expansion; application-body geometry stayed identical; only one page-navigation list existed; project conversation expansion and the guest identity menu worked; Tab/Shift+Tab wrapped and Escape returned focus. Mobile 390 × 844: toggle stayed `(16,12,44,44)`, page width/scroll width both 390, profile remained within the viewport, backdrop and repeated ellipsis dismissal worked, and collapsed page icons were hidden. Cancel preserved the original project/answer; confirmation opened a different session at the empty first question; the original Nail tech project appeared in archived journeys with the same expiry. Archived Discovery remained readable with mutation controls disabled. A second synthetic exploration report was prepared in the QA guest project, archived through the confirmation flow, reopened from its saved snapshot, and downloaded as a real PDF through the browser. A real-browser focus timing issue on cancellation was corrected and rechecked. Created another conversation in the active guest project and verified both conversations, their dates and the active marker. The hovered profile control computed a transparent background. Final desktop proof is saved in `.cache/qa/navigation-drawer.jpg`.

## Limits

DOM tests use jsdom with a visibility shim for focus traversal; actual layout, inert behaviour and responsive geometry require the browser checks described above. No assistive-technology certification, production deployment, load test, operating-system reduced-motion emulation or GitHub OAuth end-to-end test is claimed. GitHub OAuth remains an existing unavailable integration point. Account profile rendering is covered by DOM tests, and authentication/ownership/transfer by integration tests; no new browser account was registered. Project expansion is intentionally local to the mounted shell. Archived guest work cannot be edited while another guest project is active. Only saved reports offer PDF export; no new whole-project archive download was introduced.
