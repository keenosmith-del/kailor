Owner-requested follow-up: the cloud “Built for…” MP4 uses its original native autoplay, loop and loaded-data fallback behavior again; the new viewport playback controller has been removed. Other launch changes remain.

# Current controlled-launch composition — 22 October 2026

This section supersedes the historical architecture/composition notes below. The approved visual identity remains unchanged.

Public routes are Home; minimal How it works, Timeline, Pricing, Careers and Contact shells; and initial Privacy, Terms and Cookie information pages. Only Home is indexable. Services/About/Work remain in source and are not published routes. Every linked public/auth subpage shares `PageBack`; direct entry falls back to Home without following external history.

Homepage uses Hero, Marquee, Introduction, StackedPanels (outside SectionReveal to preserve sticky positioning), Conversation, Collaboration, development-only ClientPerspectives, Perspective and Activity. SelectedWork/Consultants remain uncomposed. `ClientPerspectives/` is the sole testimonial implementation; demo material is hard-gated out of production. Hero request text is still; three approved positions remain visible. Active reveal children repeat, timed visuals pause offscreen/hidden, video readiness recovers on route return, and reduced motion remains static.

`components/public/navigation.ts` is the shared sidebar/footer publication inventory. `PublicLayout/routes.json` drives route metadata and build-time prerendering. `CookiePreferences/`, `PageBack/` and `PageShell/` have colocated TSX/CSS. Auth remains one shared shell/hook with monochrome form styling and content transitions. Unfinished page sections retain source/CSS in place.

See [asset allocation](ASSET_ALLOCATION.md) and [controlled launch verification/deployment](../deployment/CONTROLLED_LAUNCH_READINESS.md). Footer composition and oversized wordmark remain; the bottom row adds legal links and the Cookies preference control.

---

# Public website — implementation and editing guide

19 October 2026. Local implementation in the existing React/TypeScript/Vite application. Uses the installed Motion, Lucide and React Router libraries; no new dependencies, repository, native mobile application, inference provider or deployment.

## Architecture and copy

`App.tsx` separates `/`, `/services`, `/how-it-works`, `/about`, `/pricing`, `/contact` into a lazy-loaded `PublicLayout` with its own header, main and footer. App/auth/preview/founder/plan routes keep their existing components and workspace layout and are separately loaded. Public visits do not fetch account state or allocate guest accounts. Account lookup occurs when entering the application. `/app` redirects to `/app/chat`; old application URLs remain supported.

Each public page lives in `frontend/src/pages/Public/<Page>/<Page>.tsx` with its own CSS. `Home/Home.tsx` contains all eleven homepage sections and inline homepage copy. `content.ts` holds shared service copy, process steps, engagement descriptions and contact details. Page-specific explanatory copy lives in each page component. Change the hero headline in `Home.tsx`, not in an animation module. Conversation copy is the `messages` array in `ConversationVisual.tsx`; solution concepts are the `examples` array in `FeatureCarousel.tsx`.

Supporting components in `frontend/src/components/public/`:

- `PublicLayout.tsx`: compact desktop/mobile navigation, Escape dismissal, skip link, route focus/scroll, route metadata and shared footer.
- `StackedPanels.tsx`: five service panels and scroll-linked depth.
- `ConversationVisual.tsx`: locally scripted, labelled, four-message sequence; pause/play and restart; reserves message space to avoid shifting later sections.
- `Visuals.tsx`: original CSS sculptures, SVG dimensional graph and process timeline.
- `FeatureCarousel.tsx`: horizontal concept gallery, previous/next controls, touch scrolling, arrow-key controls and native detail disclosures.
- `Engagements.tsx`: three honest enquiry options shared with Pricing.
- `MediaSection.tsx`: configured video/image/poster handling and designed error/empty fallback.
- `Public.css`: scoped layout, controls and component styling. Heavy homepage composition rules are in `Home.css` and do not style the authenticated workspace.

`Intro` is retired and retained only as a compatibility re-export. Its wheel/touch interception and fullscreen scene code are gone. Native page scrolling is used throughout.

## Motion and panel choreography

Reference inspection used the owner-supplied contact sheet, enlarged video frames and key supporting images; the MP4 was not played directly. The sequence adapts its overlapping charcoal panels and visible trailing edges into an original kailor composition. No reference media is imported into the site or build. `design-references/` is now ignored by Git.

The `.stacked-panels` parent contains five **sticky** articles in normal document flow. Each article has a real viewport-related height, increasing `top` offsets (`104 + index * 15` px) and increasing stacking order. Incoming panels naturally scroll over the preceding sticky panels. The shared parent's end releases the whole stack into the following section. No wheel handlers, scroll locking or forced snapping.

Motion's `useScroll` measures the parent. Each inner panel scales from 1 to .94 over a staggered part of that progress; the origin remains top-centre. Native CSS provides the overlap even without the transform. Main controls: article `top` in `StackedPanels.tsx`, `.service-panel` height/margin, `.service-panel-inner` radius and transform range. Keep sticky ancestors free of `overflow:auto/hidden` or transforms that would change their scroll container; the outer public shell uses `overflow:clip`.

At widths below 761px, panels become independent static compositions with artwork above the copy. Reduced motion also removes sticky stacking and scaling. Hero text uses scroll-linked translation and opacity, disabled for reduced motion. Editorial word shading uses CSS view timelines where supported with a readable static fallback. SVG graph stroke and timeline line respond to scroll progress. The graph is explicitly illustrative and does not encode claimed business results.

Conversation advances every 2.8 seconds only while in view and unpaused. It finishes after four messages; restart replays it. Reduced motion displays all four immediately. Thinking dots pause offscreen. CSS handles short disclosure/hover/page-entry transitions. Global and public reduced-motion rules remove CSS animations/transitions; Motion also receives the user's preference through the existing `MotionConfig`.

## Media

See `frontend/public/media/README.md` for exact examples and paths. The central configuration is `frontend/src/pages/Public/media.ts`; meaningful media directories are `hero/`, `conversation/`, `work/`. Empty paths deliberately render original fallbacks, not broken media elements. Desktop/mobile MP4, poster, GIF/static image and accessible description fields are supported. Watched recordings retain native controls. Background playback pauses offscreen and for reduced motion. Always supply static posters for animated media and review final crops, contrast and transcripts/captions when real recordings arrive.

## Monochrome baseline

`styles/tokens.css` defines White, Soft White, Platinum, Ash, Graphite, Onyx and Jet Black plus semantic backgrounds, text, borders, shadows, button and focus roles. The public shell references the semantic foreground and uses neutral surface steps. `global.css` retains `--color-cream` **as a deprecated compatibility name for soft white**, `--color-charcoal` for Onyx, and maps existing paper/surface/border/muted roles to the new baseline. A compatible neutral `#fafafa` application background remains.

Old non-neutral hex literals in existing application CSS have been neutralised without changing layout. Existing components still contain some local **neutral** colours; gradual token consolidation is safe during future component work. Auth/mascot/source assets are existing assets, not structurally redesigned here; the public mascot is filtered to grayscale. Backend-generated reports and historical design documents were not recoloured. Do not reintroduce old cream or selected warm-node accents from superseded documentation.

All button elements get pill radii, including old compact controls. Public icon controls have equal width/height and intentional circular geometry. Cards use 22–40px radii. Visible focus uses a neutral outline. Helvetica Neue / Helvetica / Arial remains the family; public editorial headings use regular weight and restrained negative tracking.

## Accessibility, SEO and responsiveness

Semantic landmarks and headings, named navigation regions, actual routes, native details/summary disclosures, contact mail links and copy feedback. Mobile nav is an inline expanding navigation, not a modal: it does not trap focus; Escape restores the trigger. App navigation stays independent.

Page metadata updates client-side: title, description, Open Graph title/description/URL and canonical. Initial HTML includes homepage sharing metadata, a monochrome theme and SVG favicon; the existing mascot is the initial social image. `robots.txt` and `sitemap.xml` list the six public pages and exclude private paths from crawling. App routes get client-side `noindex`. Full per-page crawler/social metadata needs route-aware HTML/prerendering at hosting; SPA metadata alone does not guarantee a social crawler executes JavaScript.

Desktop, tablet and mobile use explicit recomposition; no viewport-constrained app layout is applied to the public shell. Carousel horizontal scrolling is intentional inside its own region. The graph has a text description and process labels; its numeric tiles are actual service/journey counts. See the verification record for tested widths and limits.

## Start, validate and launch

Existing installed dependencies are sufficient:

```bash
npm run dev -w frontend  # website preview, 127.0.0.1:5173
npm run dev             # frontend plus existing API
npm run typecheck
npm test
npm run build
```

No database commands are necessary for the website. Follow existing setup documentation only if the application itself needs an environment. Review [PUBLIC_WEBSITE_LAUNCH.md](../deployment/PUBLIC_WEBSITE_LAUNCH.md) for the actual registration/guest/inference exposure, recommended controlled-launch settings and same-origin HTTPS/SPA hosting requirements.

Owner approval still needed: overall visual direction, final original videos/posters/recordings, final commercial wording and access policy, approved social card, staging checks and deployment. No prices, clients, testimonials, commercial results, autonomous AI capabilities or working third-party integrations have been invented.
