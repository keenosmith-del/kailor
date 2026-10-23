# Pre-deployment cleanup and public build report

24 October 2026. Changes are local only: no commit, push, deployment, DNS change or production activation was performed.

## Scope and audit

The audit traced static imports, re-exports and dynamic imports from the full application, public website, both prerender entries and frontend tests. It inspected CSS, literal public URLs, generated portrait paths, the mascot state registry, build scripts and asset-allocation documentation. The remaining public source graph has no unexplained orphan component; the public Careers email component is selected by the public-build alias and covered by a regression test.

Backend and shared files, plus Application, Discovery, Workspace and Auth source trees, were verified byte-for-byte against the pre-cleanup snapshot. Their functionality, schemas, migrations and tests were not removed.

## Removed components

These 20 implementations had no active route, static/dynamic consumer, test consumer or required integration. Their paired stylesheets were removed too:

- `frontend/src/components/public/Engagements/Engagements.tsx`
- `frontend/src/components/public/FeatureCarousel/FeatureCarousel.tsx`
- `frontend/src/components/public/InsightGraph/InsightGraph.tsx`
- `frontend/src/components/public/ProcessTimeline/ProcessTimeline.tsx`
- `frontend/src/pages/Public/Contact/ContactHero/ContactHero.tsx`
- `frontend/src/pages/Public/Contact/ContactLinks/ContactLinks.tsx`
- `frontend/src/pages/Public/Contact/DirectContact/DirectContact.tsx`
- `frontend/src/pages/Public/Home/ClientJourneys/ClientJourneys.tsx`
- `frontend/src/pages/Public/Home/Closing/Closing.tsx`
- `frontend/src/pages/Public/Home/Consultants/Consultants.tsx`
- `frontend/src/pages/Public/Home/EngagementSection/EngagementSection.tsx`
- `frontend/src/pages/Public/Home/Insights/Insights.tsx`
- `frontend/src/pages/Public/Home/Intelligence/Intelligence.tsx`
- `frontend/src/pages/Public/Home/Outcomes/Outcomes.tsx`
- `frontend/src/pages/Public/Home/SelectedWork/SelectedWork.tsx`
- `frontend/src/pages/Public/HowItWorks/HumanAI/HumanAI.tsx`
- `frontend/src/pages/Public/HowItWorks/ProcessEditorial/ProcessEditorial.tsx`
- `frontend/src/pages/Public/HowItWorks/ProcessHero/ProcessHero.tsx`
- `frontend/src/pages/Public/HowItWorks/ProcessOverview/ProcessOverview.tsx`
- `frontend/src/pages/Public/Work/Work.tsx`

Also removed the orphaned `frontend/src/pages/Public/Timeline/EvolutionArchive/EvolutionArchive.css`. The tested Timeline implementation and active shared capability modal remain.

## Removed assets and media-directory files

- `frontend/public/media/.DS_Store` (8,196 bytes)
- `frontend/public/media/README.md` (2,357 bytes)
- `frontend/public/media/work/README.md` (81 bytes)
- `frontend/public/media/hero/.DS_Store` (6,148 bytes)
- `frontend/public/media/hero/README.md` (81 bytes)
- `frontend/public/media/hero/kailor-hero.mp4` (60,923,798 bytes)
- `frontend/public/media/conversation/README.md` (81 bytes)
- `frontend/public/documents/selected-work/avenor-scope.pdf` (81,428 bytes)
- `frontend/public/documents/selected-work/manufacturing-qc-scope.pdf` (81,691 bytes)
- `frontend/public/documents/selected-work/morrow-scope.pdf` (81,304 bytes)
- `frontend/public/documents/selected-work/northline-scope.pdf` (81,302 bytes)
- `frontend/public/videos/kailor-built-for-loop.mp4` (110,501 bytes)
- `frontend/public/laurel-wreath.png` (373,956 bytes)
- `frontend/public/clients/17.jpeg` (92,573 bytes)
- `frontend/public/clients/18.jpeg` (130,006 bytes)
- `frontend/public/clients/19.jpeg` (46,559 bytes)
- `frontend/public/clients/20.jpeg` (89,071 bytes)
- `frontend/public/.DS_Store` (16,388 bytes)
- `frontend/public/clients/.DS_Store` (6,148 bytes)
- `frontend/public/mascot/.DS_Store` (14,340 bytes)
- `frontend/public/team/.DS_Store` (6,148 bytes)

## Removed configurations and archives

- `frontend/src/pages/Public/media.ts`: unused hero/media configuration. Its `PublicMedia` type now lives with the tested `MediaSection` helper.
- `frontend/src/pages/Public/media.backup.ts.txt`: obsolete configuration backup.
- Unused `steps`, `engagements`, `email` and `mail` exports from `pages/Public/content.ts`; the `services` data used by tested public components remains unchanged.
- `docs/archive/public-assets/kailor-selected-work-refresh.zip`
- `docs/archive/public-assets/SelectedWork.tsx`
- `docs/archive/public-assets/SelectedWork.css`
- `docs/archive/public-assets/README.md`
- `README.txt`

The current architecture, asset allocation, website-style and launch documents were updated. Historical iteration reports were retained as history rather than rewritten to imply their past deployments or designs never existed.

## Styles

Removed 32 confirmed-unused selectors or selector-list entries across these files. Dynamic capability-position classes were explicitly preserved.

- `frontend/src/components/public/ConversationModal/ConversationModal.css`: 4 selector entries.
- `frontend/src/components/public/ConversationVisual/ConversationVisual.css`: 4 selector entries.
- `frontend/src/components/public/Header/Header.css`: 2 selector entries.
- `frontend/src/components/public/PublicLayout/PublicLayout.css`: 1 selector entries.
- `frontend/src/components/public/primitives.css`: 8 selector entries.
- `frontend/src/pages/Public/Home/Activity/Activity.css`: 1 selector entries.
- `frontend/src/pages/Public/Home/ClientPerspectives/ClientPerspectives.css`: 1 selector entries.
- `frontend/src/pages/Public/Home/Perspective/Perspective.css`: 1 selector entries.
- `frontend/src/pages/Public/Home/SectionReveal/SectionReveal.css`: 2 selector entries.
- `frontend/src/pages/Public/Timeline/Timeline.css`: 8 selector entries.

No active hero stylesheet, animation definitions, homepage copy, component composition, sidebar behaviour or footer branding was redesigned.

## Dependencies

No runtime or development dependency was removed or added to the repository. The existing frontend dependencies are used; backend/application dependencies remain necessary for the separate product. The official Netlify CLI was installed outside the repository in a temporary tools directory and is not a site dependency.

## Size reduction

All figures below are uncompressed file bytes, not transfer-size estimates. Build folders and Git history are excluded from the repository working-tree calculation.

| Measure | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Public asset source folder | 99.46 MB | 37.31 MB | 62.15 MB |
| Full-stack frontend output | 100.47 MB | 38.38 MB | 62.09 MB |
| Dedicated public artifact (first isolated build → final) | 10.17 MB | 9.33 MB | 0.83 MB |
| Previous combined production output → public-only output | 100.47 MB | 9.33 MB | 91.14 MB (90.7%) |

Removed 69 obsolete files containing 62,281,212 bytes (62.28 MB). Net tracked/non-ignored working-tree reduction, including the new deployment/build support and this report, is approximately **62.2 MB**. This is a working-tree cleanup; previously committed video bytes remain in Git history. No history rewrite was attempted.

The much larger public-only artifact reduction also comes from excluding retained application code and application assets from publication; those product files were not deleted.

## Intentionally retained

- `MediaSection`: existing test coverage for reusable media fallback behaviour; no retired hero configuration or video remains, and the helper is absent from the public production graph.
- ClientPerspectives and portraits 21–30: approved development-only section and existing hard production gate. The production artifact excludes the synthetic testimonial text and portraits.
- About, Services and Timeline components: referenced by regression tests and, for Timeline, explicit recovery checks in the launch verifier. They are not newly published routes.
- Application `PlanNavigation` and `useDiscoveryEntry`: unfinished product components/hooks, not abandoned public UI.
- All application mascot poses, head variants and the documented sitting mascot: product state selection and retained application design references require these assets.
- `team/jillian.png`, `team/keeno.png`, `team/seth.png`: team artwork associated with the intentionally disabled Our Team destination; no evidence established that the underlying team assets are abandoned.
- `clients/31.jpeg`: explicitly reserved in the existing allocation document; retained rather than assuming permission to remove an allocated source asset. It is not deployed.
- `social/kailor.svg`: authoring source for the active social card. Only the PNG is deployed.
- Duplicate head image URLs remain because public and application components use their established paths. Replacing them would be a separate URL/integration change.

## Public-only deployment preparation

`npm run build:public` now uses a dedicated entry and output directory (`frontend/dist-public`). A checked source-module allowlist rejects private runtime or backend imports; only assets referenced by rendered public output are copied, with explicit support for the generated About portraits. The manifest records the graph and shipped assets for verification. The normal full-stack build/development commands remain available.

The public output preserves existing titles, descriptions, canonical URLs, sitemap, robots.txt, social metadata and route-indexing settings. The existing production testimonial gate remains enforced. Two deliberate deployment adaptations, separate from cleanup, are present: account links show public availability pages without an authentication interface; Careers offers an email introduction without uploading CVs or requiring a backend. Local/full-stack account and Careers functionality remains unchanged.

Unknown/private URLs use a static noindex 404, with no application/API proxy. `netlify.toml` publishes only the public artifact, preserves retired-route aliases, prepares the www-to-apex redirect and basic security/cache headers. The live domain is not attached or switched. The local static preview is available through `npm run preview:public`.

Existing local EmailJS identifiers were found without printing values. No provider environment variables have been configured remotely. The existing `frontend/.env.example` remains unchanged and documents the three public identifier names for subsequent Netlify setup; no credentials were committed.

## Verification

- All-workspace TypeScript checks passed; the final public build also performs the frontend TypeScript check.
- Frontend: **132 tests passed**, including the public Careers email alternative regression.
- Backend: **351 tests passed**. Their local HTTP servers required socket access outside the restricted sandbox; no backend code was changed to accommodate the environment.
- Root production build (shared, backend, frontend): passed.
- Dedicated public-only production build: passed.
- Existing launch verification on the full output: 11 prerendered routes and 386 asset references passed.
- Public-only launch verification: 11 prerendered routes and 260 asset references, production content gate, metadata, local links and source/runtime boundary passed.
- Browser comparison of baseline versus cleanup: 11 homepage sections at 1440px, 768px and 390px had identical geometry, headings and image selections.
- Local public-only browser check: all 11 published routes loaded directly; assets delivered without missing-file errors; six unknown/private URLs returned 404 with noindex and no canonical; no application API fetches occurred.
- Contact provider requests were intercepted and aborted to verify the failure state and retained draft without sending a message. Real EmailJS receipt/delivery was not asserted.
- Existing interactive demonstration tests passed; no AI/backend dependency was introduced.
- Baseline, cleaned and public-only builds matched hero animation names/durations, moving marquee behaviour and all four sticky service panels.
- Vite emits an advisory for the roughly 509 kB uncompressed public JavaScript entry (about 161 kB gzip); this does not fail the build. Further route splitting remains a possible separate performance refinement.
- Git whitespace checks passed. Database integration tests were not run; no schema, migration or database-facing implementation changed.

No remote deployment was performed or claimed. Remote Netlify authorisation/configuration remains pending from the earlier setup request, and the latest no-deployment instruction is in force. Any public domain activation still requires a separately verified remote preview and owner approval.
