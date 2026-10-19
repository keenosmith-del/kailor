# Iteration 018 — Solution canvas rebuild

Date: 17 October 2026. Changes are intentionally unstaged and uncommitted. No branch, worktree, commit, push, reset or Git history operation was performed.

## Outcome and boundaries

Solution canvas now displays concrete, evidence-supported solutions instead of a reasoning graph. Separate, lightweight conceptual previews cover websites, social profiles, booking, delivery operations, stores, automation and other platforms. Tiles open a centred detail modal; independent checkboxes select solutions for consideration. Existing Introduction, Welcome, authentication, Discovery, Analysis, Sources and sidebar layouts were not redesigned. Chat receives a small contextual handoff extension; the existing founder workspace receives a consultancy inbox.

There is no commissioned engagement, consultant directory, quotation, booking, invoice, payment or progress model in the audited repository. This iteration implements genuine **pending consultancy requests**, not commissioned work or simulated implementation. No percentages, milestones, consultant assignments or progress links are manufactured.

## Reused architecture

The repository is a React/Vite frontend, Express modular backend, shared TypeScript/Zod contracts and PostgreSQL/Prisma persistence. Existing project ownership is `Plan.adminId`; sessions belong to that project and principal. Guided answer mutation already validates relevance, evidence quality, conflict resolution and revisions. Existing Canvas state lives in `Plan.canvasState`; `saveCanvas` serialises project edits, audits the prior state, advances current knowledge and leaves saved report content untouched. Assessment snapshots and historical PDF/source URLs remain unchanged.

The old `graph`, `components`, `consulting`, `existing`, revision and note fields remain on `GET /sessions/:id/canvas` for existing consumers. The additive `solutions` field is the new page's projection. `canvas-model.ts` remains an evidence/compatibility implementation; the new frontend has no graph, connectors, dot grid or permanently visible evidence panel.

## Solution projection and granularity

`shared/src/solutions.ts` projects real current recommendations and consulting directions. Stable IDs remain existing service/direction IDs, or an existing user idea UUID. A direction and recommendation with the same ID produce one tile. The operational recommendation path now preserves independently requested interventions such as a business website; operational platform capabilities stay with the platform, while custom implementation remains an approach comparison for that platform. Individual requirement IDs never create solutions. Optional supporting service recommendations do not automatically become separate interventions. Illustrative exploration examples with no client-specific basis are excluded. Insufficient evidence yields an intentional empty state, while explicitly user-proposed ideas remain available.

Titles normalize service vocabulary: website → “Build a website”, booking → “Online booking system”, and a supported established delivery-management evaluation → “Delivery management platform”. Normalisation does not change the implementation approach, recommendation identity or original report. Other industries retain their actual recommendation titles and receive an appropriate category preview. User titles and notes take precedence and remain identifiable as refinements.

The existing evidence gate did not support explicitly requested Instagram setup. A service and evidence direction were added, supported by attributed current statements and suppressed when the channel already exists or the setup is declined/hypothetical. Explicit website and booking requests also pass through the shared evidence policy; industry names alone still do not establish need. These deterministic recognisers remain bounded English-language rules, not universal semantic understanding or vendor verification.

Requirements retain essential, optional, deferred and unconfirmed priorities plus explicit/interpreted provenance. Capabilities belong inside a solution. User-added capabilities are scoped to their solution, have stable UUIDs and are carried into future assessment requirements with a Canvas source. Existing capabilities can be deferred out of the first phase without erasing the original evidence. Duplicate custom labels are suppressed. Logistics regression keeps ten essential capabilities, two optional additions and four deferred items; GPS and advanced routing remain deferred.

## Visual architecture and interaction

`Canvas.tsx` orchestrates loading, mutations, project isolation, selection, reconciliation and navigation. `SolutionVisual`, `SolutionModal`, `SolutionDetail`, `SolutionEditor` and `RequestReview` keep page-specific presentation and forms separate. Preview CSS is isolated in `SolutionVisual.css`; the remaining styles are Canvas-scoped. No new runtime dependency or asset bundle was introduced.

The page uses the existing warm paper/charcoal palette, Helvetica typography, shared button classes, pill treatment, restrained edges and quiet status labels. It retains the application's navigation. One solution occupies a centred collection capped at 740px with a controlled visual height. Collections use two columns on laptops, up to three on wide screens and one below 700px. Titles wrap; selection and details are separate controls. Supporting actions and assessment preparation remain secondary.

The native top-layer `<dialog>` is explicitly centred with fixed insets and automatic margins (the global CSS reset removes browser default centring). It has an opaque paper surface, rounded corners, subdued backdrop blur and bounded internal scrolling. The close control remains reachable. `showModal` makes the background inert; explicit Tab/Shift+Tab cycling includes links and disclosure summaries, filters invisible controls and avoids focus escaping into browser chrome. Escape and backdrop dismissal work; cleanup restores scroll and the original trigger's focus. Opening/closing use short opacity/position transitions. Reduced-motion preference bypasses the close delay and disables decorative transitions. Mobile fields use 16px text and comfortable controls; safe-area padding protects the bottom.

The previews are clearly conceptual category illustrations, not selected vendors or finished deliverables. The existing supplied mascot artwork remains unchanged. No image-generation service was used.

## Editing, revisions and historical records

Users can edit the solution title/objective, add or remove their additional capabilities, set priorities, defer/set aside/reconsider a direction, correct an attributed string answer, add a proposed solution, and add/edit project constraints or decision notes. Fact corrections call the existing answers API with its current session revision; they are not written into a separate memory store. A rejected correction or save preserves the form and shows an error inside the modal. Concurrent writes require reload/review rather than overwriting another edit. Archived projects are read-only. The session shell allows Canvas read controls in an archived project; every Canvas mutation remains independently disabled and server-protected, while details and reasoning exports remain accessible.

Canvas additions preserve the existing idea/constraint/decision structure. Ideas are labelled “Your proposal”; constraints and decisions remain accessible under project notes. Canvas undo restores the prior Canvas state, including selections. It does not undo a guided fact correction or mutate a report.

Selections now optionally include `{selected,basisRevision,updatedAt}` under the stable solution ID in the existing Canvas JSON. The Zod extension is backward compatible; old clients/states without `selections` still parse. Legacy selected/developing decisions are interpreted as selected for consideration, never commissioned. A deliberate new selection updates the legacy decision too, keeping existing Chat/report context compatible.

`Solution.revision` is a deterministic fingerprint of the current fact/requirement/refinement basis, not an implementation version or sequential counter. Edit-key ordering is canonicalised for PostgreSQL JSONB. Selection timestamps and legacy decision-only changes do not invalidate their own selection. Material project changes conservatively mark retained selections for review. The user can confirm the changed scope or deselect it. If a recommendation disappears, its saved selection/decision is retained and the page offers explicit reconciliation. Request submission is blocked until missing selections are reconciled. The current scope fingerprint is not used as an authorisation mechanism: ownership and the project revision are checked independently.

Historical snapshots remain immutable. Current edits influence later assessments through the established `saveCanvas`, consulting and requirement pathways. The new adapter never writes into an existing report. Saving a consultancy request also snapshots scope; later edits cannot rewrite its submitted content.

## Multi-selection and real consultancy requests

One or several solutions can be selected independently, retained through navigation/reload and reviewed together. Review lists the included scope, individual capability priorities, constraints, user-proposal provenance and a notes field. Removing an item changes only that project's selection. A request is an intake for scope discussion, not a contract.

The additive `ConsultancyRequest` table stores:

- Server-generated ID, owner and parent project; original session provenance.
- Unique client request UUID for retry idempotency.
- Server-owned `pending` state and creation timestamp.
- Immutable JSON scope containing each selected solution's ID, scope revision, title, requirements, evidence, objectives, assumptions/alternatives, recorded refinements and constraints.
- The submitted notes and project/knowledge revisions.

The project foreign key cascades with the owning project. Owner/session identifiers are retained provenance; endpoint checks validate their membership before insertion. No user-supplied owner, lifecycle status, consultant or arbitrary scope is accepted. The backend reconstructs scope from the owned current Canvas, verifies every selection and fingerprint, checks the project revision and serialises against project mutations. Stale, foreign, duplicate-solution, missing-selection and review-required requests are rejected. Retrying an accepted UUID returns its existing receipt. Foreign UUID reuse returns a conflict without disclosing the other request.

The admin-only inbox at `/founder` retrieves real pending requests, account contact details, individual scoped solutions, capability priorities and constraints. It supports pagination and refresh. Members have an owner-scoped project request endpoint; an admin's inbox does not grant access to another principal's project/session APIs. There is no delivery notification or automatic assignment. The platform owner must review the inbox and use the established external business process to respond.

Saved requests appear on their associated current solution as professional help requested. If scope later changes, the UI distinguishes that from the already submitted snapshot. A new request warns when previous requests already include the selected solutions.

## Guests and drafts

Guests can explore, edit and select using the existing guest principal and project ownership. Their retention remains temporary (maximum existing 24-hour access); no permanent saving is implied. Request submission requires a real account. The review routes guests to the existing Account flow, where sign-in and explicit project-transfer consent are already implemented. The same project/solution identities survive transfer. Notes and retry UUID are stored in tab-scoped sessionStorage under the project ID; browser storage failure leaves an in-memory draft and does not claim persistence. Submission failures retain entered notes and selections. No request success is shown unless the server stores a request.

## Reasoning export

`GET /sessions/:id/solutions/:solutionId/reasoning` (also under `/api/guest`) uses the owned current Canvas and existing PDFKit dependency. It exports the solution purpose, current project/scope revisions, timestamp, recommendation versus user origin, decision, evidence references and quotes, capabilities/priorities, constraints, alternatives, uncertainties, recorded refinements and next step. It explicitly identifies current living context; it is not the historical assessment PDF. Existing saved report download routes are unchanged.

Website and logistics downloads were exercised through the real browser/API. The one-page website and three-page logistics documents were rendered with Poppler and visually inspected. Fontconfig needed a temporary writable cache/config on this machine; that renderer configuration is not an application dependency. The initial logistics render exposed source-field constraints whose `kind` was generic; constraints now include the authoritative constraints/budget/timing source fields as well as explicitly classified constraint facts.

## Migration and local operation

Migration `202610170001_solution_requests` only creates the request table/indexes/foreign key and inserts the new Instagram service if absent. It does not rewrite Canvas JSON, answers, reports or assessments. It was applied successfully to local `kailor` and isolated `kailor_test`; no reset or reseed was used. Existing Canvas records are adapted at read time. Run `npm run db:generate` and `npm run db:migrate` before running this code elsewhere.

## Verification record

Final executed results: **327 backend unit/deterministic tests, 36 frontend tests and 165 integration tests passed**. All workspace type checks and the production build passed. Final `git diff --check` passed after removing generated trailing blank lines. Integration-generated changes to tracked historical QA JSON files were restored to their exact original bytes using read-only Git object retrieval and ordinary file writes; they are not part of this iteration.

All inference used for this iteration's checks was local/mock. Commands and final counts are recorded below; live Cloudflare inference, external vendor systems and production hosting were not exercised.

- `npm test`: backend deterministic/unit suite and frontend component tests.
- `DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration`: isolated PostgreSQL integration suite.
- `npm run typecheck`: all workspaces.
- `npm run build`: shared/backend/frontend production build. Vite reports a non-failing main-chunk size advisory; no additional library was introduced.

New coverage includes website-only and website-plus-Instagram mapping, explicit requests versus existing/declined channels, logistics grouping/deferred features, empty states, retained selections, JSONB key ordering, user-scoped requirements in later assessments, missing legacy selection reconciliation, edits and failure recovery, reasoning download and ownership, Chat URLs, exact combined request revisions, duplicate scope validation, server persistence/idempotency, guest submission restrictions, actual guest-to-member transfer, member/admin access and immutable request/report snapshots.

Browser checks used the actual Vite/Express/PostgreSQL application, not mocked page data. Disposable guest projects were explicitly marked synthetic. The local QA helper `scripts/verify-solutions.ts` rejects non-guest or existing non-synthetic conversations; its logistics path uses the same validated custom/scope branch as the established integration fixture. An earlier fixture attempt was rejected by normal question relevance until that branch was supplied; no relevance check was bypassed.

Checked viewports: 1365×1000 and 1536×1000 desktop, and 390×844 mobile (also the initial 409px browser viewport). One/two/three/five tiles, long titles, user proposals, retained selection after reload, grouped long logistics capabilities, centred modals, internal scrolling, no horizontal page overflow, distinct selection/opening, keyboard cycle/Escape/focus return, guest combined review and contextual selected-logistics Chat prefill were inspected. Narrow booking preview clipping was fixed after measuring the rendered calendar; screenshots and PDF render artifacts are under ignored `.cache/qa/iteration018/`. This is browser viewport verification, not physical iPhone keyboard testing, a formal screen-reader audit or cross-browser certification.

## Follow-up contracts (not implemented)

Formal proposals should reference an immutable request and explicit agreed revisions, then require an independently recorded acceptance. Consultant accounts/assignment and message access need role/ownership checks; a directory needs verified identity and availability. Booking requires a real provider and reservation lifecycle. Quotations, invoices and payment need business approval, currency/tax/terms, provider callbacks and reconciliation.

A commissioned `ImplementationEngagement` should join the parent project to one or several stable solution IDs and their accepted scope snapshots. Its authoritative assignment, lifecycle, milestones, client reviews and deliverables should power a dedicated progress route. Only a verified engagement should expose “View progress” or commissioned/in-progress states in Canvas. Recommendations and old selected/developing decisions must never backfill commissioned work. Notifications need a real delivery queue/preferences; an account-wide work overview should aggregate those actual engagements. No frontend feature flag turns any of these into live workflows.

## Visual-direction correction

The later user addendum supersedes this iteration's conceptual mockup illustrations and tinted visual surfaces. [Iteration 019](019-solution-canvas-visual-correction.md) records the implemented kailor-artwork/icon profile cards, crisp white surfaces, smaller modal identity, neutral selection, reusable visual mapping and updated browser evidence. The functional/data contracts described above remain in effect.
