# Homepage corrections — 23 October 2026

This correction supersedes the previous iteration's Activity latch, metric content and verbose section labels. Existing white Services panels, capability archive, Conversation, Collaboration, header/footer design and modal interactions are preserved. No deployment was performed.

## Motion

Activity observes stationary grid slots with `once: false`, threshold 0.4. Independent children reveal with opacity 0→1, y 35→0, scale .94→1, .75s easing and .095s index stagger. Exit has no entrance delay so fast reversals can reset promptly. Hover remains on a separate inner surface (scale 1.035, y -4). Section scroll opacity/movement now affects only the heading, keeping the observed grid and all its ancestors stationary. This removes geometry feedback without latching entrances or redesigning pills.

The marquee has no hover/focus pause rule or JavaScript pause handler. The two identical groups, 85s animation, capsule design, masks and 43-entry inventory are unchanged. Reduced motion retains a static, focusable horizontal scroller with the duplicate group hidden.

## About and evidence

Heading is **About**, retaining `id="introduction"`, editorial typography and the featured/two-supporting-card arrangement. All three counts retain count-up animations.

Reviewed the local portfolio's AI, Cloud and Full-Stack CV source variants, their common professional record, source-reviewed project catalogue and 18 October repository evidence report. These are owner records, not an independent audit of customer outcomes.

- **6+** follows the existing owner experience baseline and professional history.
- **8+** is a conservative minimum supported by eight distinct implemented portfolio projects: AI Entity, Personal Productivity Desktop, Music API, Enterprise Workspace, Microsoft AI-powered Software Engineering/DevOps, AWS Banking and Payment Risk, GCP Retail and Supply Chain, and Ollama Private Business Intelligence. The portfolio audit records substantive runtime implementations for each. Forks, documentation-only concepts, experiments and multiple versions of one project were excluded. This is independent engineering work; no commercial deployment or commissioning is inferred.
- **3+** is supported by three separate confidential engagement entries in the common CV record. They cover automation, application engineering and process assessment. No client names or confidential source material were copied into the website or this report. Supporting contracts/delivery records were not independently audited.

Exact About card copy:

### Engineering experience — 6+

Years working across software engineering, intelligent applications, systems architecture and cloud technologies, bringing practical development experience to demanding business and technical challenges.

### Engineering projects — 8+

A portfolio of independently developed software and technical systems, spanning business intelligence, operational automation, financial technology, cloud architecture and AI-enabled applications.

### Consultancy experience — 3+

Documented engagements involving business process assessment, AI-enabled applications and operational automation, with technical recommendations shaped around real organisational needs.

The six existing portraits remain. A seventh text-only circle reads **+32**, configured once as `introductionAdditionalCount` in `homeMetrics.ts`; it uses the same 46px diameter, -13px overlap and hover treatment, with z-index 7. It has no tooltip or verified-client attribution. This remains owner-supplied display content requiring final business-claim review before deployment.

## Built around what matters

The original four-card layout, surfaces, hover and stagger remain. Values use container-relative type sizing to fit the editorial words at the existing breakpoints. All former numeric/internal-product metrics are removed.

Exact card copy:

### Operational efficiency — Simplify

Reduce repetitive administration, fragmented processes and unnecessary manual work through better software, practical automation and more considered operational systems.

### Connected technology — Integrate

Bring applications, data and business processes together so information moves more reliably between the tools an organisation already depends on.

### Purpose-built engineering — Build

Engineer web applications, internal platforms and intelligent software around real requirements, with architecture designed for usability, security and continued development.

### Long-term technical thinking — Evolve

Improve existing systems, modernise infrastructure and extend software capabilities as operational requirements, customer expectations and technology change.

Services marketing text already describes consultancy, software engineering, automation and cloud business needs. It needs no rewrite. Approved interface examples, capability archive and functional application terminology are retained.

## Shared sidebar and footer labels

| Existing ID | Label |
| --- | --- |
| hero | Home |
| technologies | Technology |
| introduction | About |
| services-overview | Services |
| conversation | Conversation |
| collaboration | Collaboration |
| what-weve-built | What we've built |
| client-feedback | Client perspectives (development only) |
| perspective | Our approach |
| activity | In motion |

One shared `sidebarSections` inventory still drives both surfaces. Section IDs, Try it out, working page destinations and the Pricing/Timeline retirement are preserved.

## Exact files changed

- `frontend/src/components/public/navigation.ts`
- `frontend/src/pages/Public/Home/Activity/Activity.tsx`
- `frontend/src/pages/Public/Home/Introduction/Introduction.tsx`
- `frontend/src/pages/Public/Home/Introduction/Introduction.css`
- `frontend/src/pages/Public/Home/Marquee/Marquee.css`
- `frontend/src/pages/Public/Home/Perspective/Perspective.css`
- `frontend/src/pages/Public/Home/homeMetrics.ts`
- `frontend/tests/home-refinement.test.tsx`
- `frontend/tests/public.test.tsx`
- `scripts/verify-launch.mjs`
- `docs/style/PUBLIC_WEBSITE.md`
- `docs/iterations/027-homepage-corrections.md`

## Verification

- `npm run typecheck` — passed across all workspaces.
- `npm run build` — passed; 11 public/auth routes prerendered.
- `npm run test -w frontend` — 131 tests passed in 15 files. Updated experience/editorial assertions, avatar content and exact shared navigation labels; existing service and routing regressions still pass.
- `npm run verify:launch` — passed; 11 prerendered routes and 386 asset references, content gate, metadata and destinations verified.
- `git diff --check` — passed.
- Real installed Google Chrome via Playwright, production preview: 1440, 1024, 768, 390 and 320px widths. About and Perspective descriptions/values fit their cards, no horizontal page overflow, seven equal avatar circles use the existing overlap, reduced-motion marquee remains keyboard-focusable and horizontally scrollable with its duplicate hidden, and Activity is immediately visible in reduced motion.
- Activity: all six pills exited and replayed twice at every width, with intermediate fade/transform states and fully settled entrances observed. Fast scroll reversals through the footer left every grid slot at its original position. Hover scale/lift remains functional. Additional upward re-entry checks use a 600px-tall viewport so the compact footer permits the final pill to leave the screen fully; taller viewports correctly keep a partially visible final pill revealed.
- Marquee: computed position continues changing over the viewport, over a capsule and with focus inside. Animation play state remains running; 85s duration and matching duplicate-group travel establish the seamless loop.
- Sidebar and footer display identical production labels; every section link was clicked in both surfaces. Try it out remains, retired links are absent. Development-only Client perspectives mapping is covered by tests. Navigation run reported no page errors.
- Inspected desktop About/Perspective and narrow Perspective/avatar screenshots. All six original avatar images loaded successfully. Screenshots are local ignored review artifacts under `.cache/controlled-launch/corrections-*`.

No technical blocker remains from these corrections. No production deployment or live form submission was performed. The +32 display remains subject to the owner’s final business-claim review; experience evidence has the owner-record scope described above.
