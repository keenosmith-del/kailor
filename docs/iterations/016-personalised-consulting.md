# Personalised consulting — requested iteration 012

This implementation follows the user's “Iteration 012 — Personalised Consulting, Visual Intelligence and User Journey Refinement” request. The filename continues the existing documentation sequence rather than overwriting the earlier sidebar iteration 012. Work stays in the existing checkout, unstaged and uncommitted.

## Architecture review and implementation plan

The existing system already has authenticated/guest project ownership, adaptive Discovery, confirmed evidence, conversation memory/retrieval, a single Cloudflare inference pipeline with privacy/fallback controls, immutable report snapshots, project Sources and explicit guest transfer/discard. These are reused.

The principal intelligence gap is `exploration.ts` returning three fixed opportunity categories regardless of the user's detailed answers. `assessment.ts` and `conversation-guidance.ts` reproduce those categories; retrieval is not the missing piece. `canvas-model.ts` uses the same generic categories and repeats raw evidence. ReportReader is currently a linear document. Sources expands full reports inline. Conversations have no persisted editable title. The guest cookie is persistent for 24 hours; explicit exit already deletes active guest data, but automatic expired-data cleanup is absent.

Planned coherent changes, in priority order:

1. Add a grounded structured consulting projection to the existing report pipeline: concise attributed facts, capability/constraint-informed candidate directions, rationale, practical tests, uncertainty and stopping criteria. Keep deterministic fallback and enrich the existing model context/prompt; do not create another AI pipeline.
2. Add a schema-aware interactive report reader and connected Canvas groups. Persist live project canvas decisions separately from immutable reports; use existing answer mutations for factual corrections. Preserve report/PDF ownership and history.
3. Persist editable conversation titles with validation and ownership. Keep sidebar changes restricted to title editing.
4. Adapt Chat entry/suggestions to selected reports, Canvas components and Discovery; remove the persistent assessment panel; keep thinking in the message stream and make the composer a single-line input.
5. Turn Sources into a filtered project library with an intentional add-resource entry and dedicated shared report reading. Reuse existing upload storage and validation.
6. Add Start discovery/Coffee chat entry, clearer Discovery completion and shared new-project actions. Refine Account/Settings copy, use the existing profile.svg and align guest-exit buttons.
7. Use a browser-session guest cookie with the existing server expiry ceiling, reliable expiry cleanup and consistent wording. Refresh remains safe; tab closure is not treated as a server deletion signal.
8. Execute scenario/regression tests, builds and browser checks, then complete these notes with actual results and limitations.

The current style guide in `docs/style/README.md` remains the visual baseline: consistent whitish page/footer, restrained warm accents, compact pill buttons, thin controls, round white notices and the approved unified sidebar.

## Implementation and executed results

### Reused architecture

`session-service.ts` remains the owner of Discovery, Chat, assessment creation and Canvas projection. `assessment.ts` still generates the single report model; `ReportSnapshot.content` remains the immutable saved version. `ai.ts` retains the existing provider interface, usage reservation, sensitive-context guard, output checks and local fallback. Existing plan ownership, origin checks, revision locks, memory retrieval, source storage, account preferences, guest transfer and email authentication are preserved. No dependencies, separate inference pipeline, worktree or repository were added.

### Consulting intelligence

`consulting.ts` adds an attributed consulting projection to the existing report. Confirmed usable answers become facts with their original question key and quote. Unknown and skipped answers do not become capabilities. The visual projection is bounded to 24 facts, retaining each answer field before prioritising constraints and remaining detail; references only point to facts included in that projection. The existing full answers and conversation memory remain available separately.

Reusable task families cover design, coordination, administration, writing, practical work and knowledge sharing. Stated experience carries more ranking weight than an interest or tool mention. Explicit exclusions and negative capability statements suppress matching directions. Explicit product/content preferences change the proposed format to a small reusable resource or demonstration rather than silently insisting on a service offer. These are deterministic, inspectable rules, not an age/persona detector or evidence of market demand. The supplied persona produces design, organisation and administrative possibilities; furniture-repair/gardening evidence produces a different direction. Where no useful capability basis exists, examples are explicitly illustrative rather than fabricated expertise.

Each direction includes supporting fact IDs, rationale, requirements, uncertainty, cost-to-test considerations, the first deliverable, and continue/stop conditions. Available hours and reported financial limits are included; no verified price or income is invented. Experiments distinguish interest, ability, the problem, willingness to pay and repeatability. Non-commercial goals use usefulness rather than assuming a paid business. Free feedback does not establish payment demand.

Live Canvas refinements and constraints feed this projection. Selected directions move first; rejected/deferred directions are omitted from ordinary local Chat recommendations. A refined scope becomes the next experiment's scope. General Chat uses current knowledge; an old report only takes precedence when explicitly selected. A stale report is not silently used as the current recommendation. Explicit historical report discussion remains available.

The existing Cloudflare prompt/context now includes this grounded guidance and selected report context, with instructions to respect exclusions, distinguish facts from hypotheses, avoid repeated answered questions, and explain practical tests. Existing privacy/fallback contracts remain. **All executed scenario checks used mock/local guidance with remote AI disabled. No new live Cloudflare quality claim is made.**

### Guest entry and Discovery

Guest entry offers Start discovery and Coffee chat with distinct explanations. Either opens the current project's conversation; neither creates a parallel project. Coffee chat opens with a welcoming introduction and optional conversational suggestions. Discovery keeps its four starting situations, adaptive questions, saved responses, restart confirmation and mascot transitions.

Completion offers Prepare my assessment, Keep exploring with kailor, an unanswered guided question where available, and a separate new-project action. New project reuses the workspace's existing creation action. Guests go through the explicit journey replacement/archive choices; authenticated users get the existing project creation form. Preparing an assessment does not create another project.

### Project identity and continuity

Existing project rename is preserved. Conversation titles are stored on `DiscoverySession`, with a neutral default and numbered defaults for additional conversations. Sidebar editing adds only a small pencil and inline save/cancel controls. Dates remain beside titles, and the approved drawer/collapse/profile design remains intact. Title mutation validates length/control characters, ownership, archive state and revision; edited titles are never overwritten automatically.

Canvas changes use `Plan.canvasState`, not another project model. The shared bounded schema contains proposal refinements, explicit decisions and user additions. Saving locks/revalidates the owned project, checks the project revision, records the previous state for audit and invalidates derived session planning/context with increased knowledge revisions. Factual corrections use the existing answer endpoint and confirmation flow. Account preferences remain account-scoped; unrelated projects/users are not copied into context.

### Analysis, PDF and Canvas

New reports contain an optional structured consulting brief. The shared ReportReader renders concise facts, evidence/interpretation disclosure, selectable directions, qualitative comparison, the selected experiment and remaining decisions. Headings adapt to exploration, idea, operating-business and technical-solution assessments. Operational recommendations still use the existing service catalogue and technical dependencies; the full written report remains accessible. Technical-detail preference opens the evidence disclosure initially; existing-tool preference is recorded in assessment guidance. Legacy snapshots without the brief use the existing reader unchanged.

PDF export consumes that same snapshot, retaining full fact quotes, rationale, supporting evidence, requirements, risks, trial costs, validation steps, continue/stop criteria and recorded decisions. The exploratory export uses a compact two-column starting point and a clear page per direction, without repeating the entire narrative. Non-exploratory written report detail is retained. The synthetic scenario exports to four A4 pages, all visually inspected after the last PDF change.

Canvas connects grouped context, proposed directions/components and decisions with actual edges. Node selection and relationship controls expose details; evidence is available on demand. Users can correct facts, refine a step, add an idea/constraint/decision, develop/defer/set aside a proposal, and undo the last Canvas save while the view remains mounted. Repeated selection does not write data or create reports. Live edits survive navigation/refresh. Old snapshots are untouched; changed knowledge offers Prepare an updated assessment. Different existing project types keep their existing graph structures rather than being forced into the exploration graph.

### Chat and Sources

Report-linked Chat shows the report title and viewer link beside the heading, a personalised introduction for an empty transcript, contextual prompts, and the existing prefilled discussion message. Canvas links carry a node identifier; its current status is shown where available. Discovery-backed conversations use the live consulting projection for suggestions. Existing transcripts do not gain a new welcome message. The persistent assessment-ready panel and focus-only Continue conversation control are removed.

The composer is an ordinary single-line text input at a constant 42 px height. Native horizontal scrolling, cursor movement, selection and IME handling remain. Full text is submitted rather than clipped to the visible line. The existing 4,000-character API limit remains: longer drafts are retained and need shortening; they are never silently truncated. Attachment upload and failed-send draft restoration remain. Thinking appears after the pending user message without a duplicate assistant placeholder; existing reduced-motion styles are preserved.

Sources now filters All resources, Documents, References, Project notes and Assessments. Source filtering happens before server pagination. Add a resource reveals the existing upload/link/note actions. Slow responses from a previous category are ignored. Reports appear as compact library entries linking to the shared dedicated Analysis viewer, with Chat and PDF actions. Return links preserve the filter and report anchor; additional report pages load as needed to restore the selected report's position. Full reports no longer expand beneath Sources.

### Settings, Account and guest lifecycle

Settings keeps functional preferences and privacy disclosures in plainer language. Account uses the existing `/svgs/profile.svg` inside its Sign in button, matching the Introduction Create button, and concise benefits, with the existing sign-in/create-account routes and explicit transfer choice. Signing in does not silently transfer guest work. Local Chat explanations honour technical-detail preference with an evidence trace; remote prompts apply communication and implementation preferences. Project requirements take priority over defaults.

The guest cookie is now a browser-session cookie, with no persistent Max-Age/Expires. The existing server token still expires at most 24 hours after creation and is not renewed by refresh or a replacement journey. Browser restoration may retain a session cookie; tab closure is not a server deletion signal. Startup and a 15-minute interval purge expired guest principals in batches of 50, rechecking active tokens under a principal lock. Account-owned data is excluded. Expired access is rejected immediately even when cleanup has not yet run.

Explicit guest exit reuses the existing confirmed hard-discard semantics, clears only guest access/drafts and preserves account login and previously transferred work. Exit-modal changes are scoped to compact pill buttons. Cancel/Escape/focus handling is retained. Cancellation was checked in the browser; actual discard and cleanup were exercised only against isolated synthetic API fixtures.

### Data and compatibility

Migration `202610160001_consulting_workspace` adds nullable `Plan.canvasState` and `DiscoverySession.title` with a safe default. It was applied successfully to the local application and isolated test databases, with no reset or reseed. The Prisma client was regenerated; unrelated generation whitespace was removed from the diff. Apply the migration before deploying this backend elsewhere. No existing report JSON was rewritten, no unrelated account/project state was merged, and no Git writes were performed.

### Executed verification

- `npm test`: **299 backend tests and 26 frontend tests passed**. Added coverage includes the supplied persona, different capabilities, exclusions, uncertainty, live refinements, bounded Canvas input, memory explanation, communication preference, interactive direction selection/comparison, schema-aware report headings, Coffee chat continuity, report library links, category-response races, long drafts, IME and complete long-message submission.
- `npm run test:integration` against the isolated `kailor_test` database: **161 tests passed across 11 suites**. Existing ownership, migration, authentication, provider fallback/privacy, account transfer, uploads and guest-journey tests are retained. New scenarios cover title validation/stale writes, Canvas persistence/revision conflicts, updated guidance, snapshot immutability, undo, PDF output, expired cleanup, server-side library filters and fact corrections.
- All-workspace typecheck and full production build passed.
- Browser: clean synthetic guest on the local preview; Coffee chat into the same Discovery session; four exploratory answers; clear completion and smiling mascot; personalised Analysis; section navigation; selecting/comparing directions; report-linked Chat; thinking placement; live Canvas decision/refinement; persisted conversation rename; creating a note; assessment library/viewer return; historical PDF download; profile asset load; guest-exit cancellation.
- Responsive browser checks at 390 × 844: document width remained 390 px, Canvas graph width 530 px panned inside its 346 px container, and Chat composer bottom was 804 px with a 42 px input. At desktop size a 3,360-character draft remained 42 px high and scrolled internally. Existing keyboard focus/cancel tests pass. Native on-device keyboards were not exercised.
- PDF: generated and rendered the final four-page synthetic export with PDFKit/Poppler; inspected every page for clipping, orphaned continuation pages, hierarchy and footer placement.
- QA screenshots/PDF are ignored local artifacts under `.cache/qa/iteration016/`. Earlier tracked QA output files modified by legacy integration tests are restored before handoff. No production deployment, remote AI call, Git staging, commit or push is part of this iteration.

### Limits and future work

The deterministic capability families are an auditable fallback, not a general inference engine or validated business advice. Broader language, unusual capabilities and more existing-business/technical scenarios need evaluation with the configured model. Live provider quality and a full manual authentication/account-linking journey were not tested here. A single-line composer still follows the existing message-size limit. Canvas undo is one step in the current mounted view; the audit record is not a user-facing version browser. Resource links remain unverified URLs; text/CSV extraction is supported, while PDF/Word/image understanding remains unavailable.

GitHub OAuth was absent in the audited implementation. No integration is claimed or placeholder sign-in added. Future work needs configured provider credentials/callbacks, verified provider identity and explicit proof of account ownership before linking; matching email strings must never silently link accounts. Existing email/password and guest flows remain.

The future optional consulting handoff can reference the existing owned Plan, selected ReportSnapshot and its directions/requirements/risks/unknowns, plus user-selected ProjectSources and recorded Canvas decisions. A later workflow should let the user review a scope and explicitly choose what is shared with which consultant. It will need consultant identity/availability, enquiry ownership/access and consent before quotations or proposals are sent. No directory, enquiry schema, sales funnel or external messaging was added. Existing tools, third-party services and independent/manual approaches remain valid recommendations.

Broader file/image ingestion should add bounded parsing and provenance to the existing source pipeline, keeping documents untrusted and separate from confirmed facts. Cross-scenario learning must continue using approved, de-identified reference patterns; private project notes/reports must not be silently promoted into global knowledge. Add further end-to-end scenarios for operational businesses, technical implementations, non-commercial goals and resource/constraint combinations before broadening automated recommendations.
