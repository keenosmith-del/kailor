# Company Timeline — 23 October 2026

This is a public editorial page; no application, backend, authentication, schema, deployment or external service changes were required. The existing header, footer, navigation destinations and homepage history link are preserved. The year/date labels intentionally avoid implying verified company events on specific days.

## Content evidence

| Content | Evidence and boundary |
| --- | --- |
| Company founded in 2025 | Owner-provided company fact in the Timeline brief. The repository starts in 2026; Git history is not used as the company's founding date. |
| Engineering before 2025 and 6+ years | Owner-provided distinction; existing Introduction/Introduction.tsx documents the same engineering-experience figure. This is not a company-age claim. |
| 2025–2026 considered approach | Owner-provided broad editorial period, consistent with PRODUCT_VISION.md's problem-first approach and present Discovery/assessment flow. No more precise event date is asserted. |
| Discovery and Analysis, 2026 | Initial working foundation a9bec8f (13 October 2026), adaptive intelligence 2e74896 (14 October), docs/iterations/001 and 003; current Discovery.tsx and Analysis.tsx, session-service assessment/report functionality. |
| Solution Canvas, 2026 | docs/iterations/018-solution-canvas-rebuild.md (17 October); current Canvas.tsx, SolutionDetail.tsx, RequestReview.tsx and shared/src/solutions.ts. Tiles, details and consultancy requests are implemented. Selection does not commission work. |
| Independent project workspaces, 2026 | 03c0cfe (15 October), docs/iterations/007 and 011; ApplicationWorkspace.tsx, useProjects.ts, ProjectReports.tsx and ProjectSources.tsx. Project conversation, retained context, sources and report history exist. |
| Accounts/customer application | 87694a5 (15 October), docs/iterations/008, current App.tsx protected routes and account/auth flows. Access controls do not make the built application hypothetical. |
| Public website, 2026 | Public-site commits c6edb6e/843eb75 (19 October), docs/iterations/020 and current PublicLayout, Home, Questions and HowItWorks implementations. |
| Consultancy handoff | RequestReview.tsx posts selected scope/context to the existing consultancy-request API. The archive therefore shows a request ready for review, rather than claiming a commissioned engagement or a delivered client contract. |
| Present / looking ahead | Owner-provided direction. Experience, delivery and integration improvements have no announced release dates, revenue figures or promised outcomes. |

PRODUCT_VISION.md contains historical future-tense application plans. Current code and implementation records supersede those completion-status descriptions. All archive interface content is illustrative; there are no fabricated customer records, screenshots, contract results or usage statistics.

## Implementation

Page sections and CSS are colocated under frontend/src/pages/Public/Timeline. timelineData.ts is the typed chronology/archive source. TimelineReveal.tsx handles reversible local fade/float motion without changing global design utilities. The chronology draws its line directly from scroll progress and keeps earlier entries readable; the mobile layout uses the same ordered list vertically. Milestone icons provide at least 44px targets. Archive surfaces reveal before their interior details. TimelineDetail.tsx uses a native dialog with the existing ModalClose component and restores its trigger on dismissal. Closing chat uses the existing ConversationProvider.

The route metadata and build CSS inventory include Timeline under the existing noindex launch policy. No indexing approval or site publication is implied.

## Validation

- `npm run typecheck`: passed all workspaces.
- `npm run build`: passed; the final presentation refinement also passed the frontend build.
- `npm run test -w frontend`: 77 tests passed, including chronology order, experience/founding distinction, milestone/archive details, keyboard dismissal/focus restoration, shared chat and navigation.
- `npm run verify:launch`: passed 12 prerendered routes and 453 asset references, metadata, links and production content gates.
- Local Chrome: checked 1920/1440/1280/1180px horizontal chronology and 1024/768/390/320px vertical layouts; no content collisions or horizontal overflow. Modal Tab/Shift+Tab/Escape and focus restoration, archive details, shared chat, three existing entry paths and route return passed. Horizontal line values increased with scroll and returned to the same value when scrolling back.
- Production preview: direct/refresh, canonical/noindex metadata, semantic list content, card styling, details/chat, desktop/mobile reduced motion and readable no-JavaScript content passed. Mobile vertical line progression reversed correctly. No application API requests were made by the page in browser verification.

Browser review artifacts are local under .cache/controlled-launch/timeline-*.png. The page remains noindex under the existing publication policy. Illustrative previews do not operate the authenticated application.
