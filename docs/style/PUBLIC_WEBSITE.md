Careers iteration — 23 October 2026: /careers now pairs Contact-related editorial copy with a white rounded introduction form, multi-select professional-interest pills, shared email-copy feedback, local PDF/DOCX attachment controls and understated navigation/chat actions. No job vacancies are advertised. Colocated ApplicationForm/CVAttachment handle inline validation, explicit privacy acknowledgement, pending state, shared confirmed-success toast and retained failure drafts. The form stays stationary while editing; existing ProcessReveal supplies individual reversible fades and reduced motion is static. Careers content remains visible without JavaScript. The private multipart API defaults closed and requires a reviewed private processor, scanning, authenticated access and scheduled deletion; no real processor is provisioned. See docs/deployment/CAREERS_SUBMISSIONS.md and docs/iterations/023-careers-page.md.

Contact form refinement — 23 October 2026: topic pills fill editable message starters and focus the message, preserving user-edited drafts. Contact and the conversation modal share EnquiryComposer with modal placeholders, the expanding rounded message area, inset send arrow and sending dots. Contact inputs match the modal and confirmed delivery uses the same toast. Contact/modal/auth forms use accessible inline validation without native required prompts. Typecheck, build, 88 frontend tests and launch checks passed; Chrome checked desktop/mobile layouts, form parity and intercepted submission.

Contact iteration — 23 October 2026: /contact now has a balanced editorial/enquiry-form composition, copy/check email feedback, functional optional enquiry topics and compact information links. ContactForm is colocated; the shared enquiries service and useEnquiry hook power both this form and ConversationModal, preserving the existing provider contract and confirmed-send toast. The form is stationary while entering content; editorial blocks fade/float with scroll. Copy errors provide a real mailto alternative. The shared service validates bounded fields and allowlisted subjects, guards duplicate submission and retains content on failure. No live mail was sent in verification; production provider configuration audit and requirements are in docs/iterations/022-contact-page.md. Metadata/prerendering retain the noindex launch policy. All-workspace typecheck/build, 85 frontend tests and launch checks (12 routes/453 assets) passed. Chrome verified desktop/tablet/390px/320px layouts, validation, stable editing, topic payloads, copy success/error, shared modal and intercepted provider success/failure; production preview covered refresh, metadata, long messages, reduced motion and readable prerendered contact information.

Timeline iteration — 23 October 2026: /timeline now renders TimelineHero, MilestoneTimeline, ExperienceFoundation, EvolutionArchive, PresentAndBeyond and TimelineClosing. Typed local content lives in timelineData.ts; its evidence map is in docs/iterations/021-company-timeline.md. Eight alternating milestones surround a scroll-drawn horizontal chronology above 1100px; tablet/mobile use a vertical line and independent readable entries. Icons and four archive studies open the same native Timeline detail dialog with the shared close style, keyboard containment, Escape and focus restoration. The experience section distinguishes the owner’s documented 6+ years from the company’s 2025 founding. Current website/application features are presented as built; future direction has no promised releases or commercial claims. Today’s consultancy handoff is described accurately as context-linked requests for review. Local repeatable scroll fades and staggered archive interiors respect reduced motion and prerendered readability. The closing reuses the shared conversation modal. Existing header, footer, Home and application code are unchanged by this iteration. Metadata remains noindex and uses “Our timeline | kailor”. Validation passed: all-workspace typecheck/build, 77 frontend tests and launch checks for 12 routes/453 assets. Chrome verified 1920–320px layouts, milestone/detail focus and Escape, archive/chat/navigation, reversible horizontal/vertical line progression and route return. Production preview additionally verified refresh, metadata, reduced motion and readable no-JavaScript content.

How it works iteration — 23 October 2026: /how-it-works now composes DiscoverySequence, SolutionDirection, ConsultancyProgress and ProcessClosing. The retail illustration gathers five selected pills, dissolves them, shows the existing mascot/thinking state and types a qualified recommendation. One clock pauses offscreen/hidden, cleans up on unmount and automatically loops after a seven-second completed-message hold and gentle dissolve. There are no playback controls. Reduced motion shows the complete recommendation immediately. The Solution Canvas illustration opens a native dialog with the shared close control, Escape, focus containment and trigger restoration. Consultancy copy explicitly separates assessment/recommendations from agreed scope and separately commissioned implementation; the workspace is labelled illustrative. The closing uses the shared conversation modal and links to /questions. Individual headings, text and visual blocks use the homepage’s reversible scroll-linked fade/float pattern. Large headings and hero supporting text have no trailing periods. View proposed direction has no arrow; ArrowUpRight is omitted from future builds. Only the Hero’s Explore what we do destination changed on Home. Legacy unused process sections remain in source. No backend, application logic, footer, registration or sidebar design changes. Route metadata remains noindex, and page-specific CSS is included in prerendered HTML. Validation: full typecheck/build, all 74 frontend tests and launch checks (12 routes, 439 asset references) passed. Chrome verified the real selection/gather/dissolve/thinking/type sequence, stable typing height, readable hold and automatic looping without controls, reversible individual scroll fades, details focus/Escape, shared chat, route return and all entry links. Desktop/tablet/mobile refresh and reduced motion passed at 1440/1024/768/390/320px; the production preview also passed canonical/noindex metadata, native details focus, card shape and meaningful prerendered content without JavaScript.

Common Questions iteration: /questions renders Questions/CommonQuestions.tsx with nine exclusive accordion items in a centred, rounded white panel on soft white. Motion animates answer height/fade and subtle repeatable in-view reveals; reduced motion removes movement. Semantic question buttons expose expanded state and labelled regions; closing regions immediately become inert and hidden from assistive technology during their exit animation. The heading follows homepage section typography; the smaller inline invitation reads “Still have a question? Let’s chat”, with a transparent text button opening the existing shared modal. The footer includes Common questions; the sidebar keeps its original eight Pages. /faqs redirects to /questions for existing bookmarks. Metadata and prerendering use /questions with noindex under the current launch policy. Typecheck, build, 69 frontend tests and launch verification passed; local Chrome covered direct entry/refresh, keyboard activation/focus, rapid switching, Back/route return, scroll re-entry, shared chat, desktop/tablet/mobile and reduced motion. The local production preview also passed direct/refresh HTML, shared chat, noindex metadata, mobile overflow and readable prerendered question headings without JavaScript.

Previous follow-up: Sidebar and footer share the original Pages and homepage-section entries; unpublished pages remain visible and disabled. Cookie preference saving closes the dialog and reuses the conversation toast. Auth Back always returns Home, guest buttons are disabled, entry-field focus outlines are removed and Sign in is compact at laptop heights. Introduction’s history action links to Timeline. Local synthetic feedback dates vary across 2025–2026.

Authentication refinement: round pill inputs, compact stacked actions, established white/charcoal hover treatments, a subtle white form container and centered password visibility controls. Shared BrandWordmark matches the homepage typography/dot and places mascot-head.png to the left on auth pages. The auth footer now spans the full white surface. All copyright notices read “© 2025 kailor. All Rights Reserved.” GitHub's existing unavailable state remains explicit; guest entry is disabled on both auth pages during controlled testing. ModalClose unifies the 14px X and the Let’s chat hover treatment for conversation, cookie, solution and new-project dialogs. All ten local feedback notes now have unique client portraits (21–30).

Owner follow-up: Hero customer pills again use the original 14-second appearing/disappearing cycle with staggered timing across all ten bubbles. Reduced motion keeps the original two static bubbles. The marquee includes all 31 local technology SVGs, adding Angular, Flutter, Spring Boot, Grunt, Gulp, MongoDB, Mongoose, Apache Kafka, RabbitMQ, Git and GitHub without duplicate technology entries.

Current owner-requested cloud visual: original in-page “Built for…” rotating typography only. The MP4 and extracted-poster layers are removed from the panel; there is no alternate visual to switch to on loading, refresh or route return. Original typography, timing and transition are restored.

# Current controlled-launch composition — 22 October 2026

This section supersedes the historical architecture/composition notes below. The approved visual identity remains unchanged.

Public routes are Home, How it works, Timeline, Contact, Careers and Common questions; a minimal Pricing shell; and initial Privacy, Terms and Cookie information pages. Only Home is indexable. Services/About/Work remain in source and are not published routes. Every linked public/auth subpage shares `PageBack`; direct entry falls back to Home without following external history.

Homepage uses Hero, Marquee, Introduction, StackedPanels (outside SectionReveal to preserve sticky positioning), Conversation, Collaboration, development-only ClientPerspectives, Perspective and Activity. SelectedWork/Consultants remain uncomposed. `ClientPerspectives/` is the sole testimonial implementation; demo material is hard-gated out of production. Hero request bubbles use their restored appearing/disappearing cycle. Active reveal children repeat, timed visuals pause offscreen/hidden, video readiness recovers on route return, and reduced motion remains static.

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
