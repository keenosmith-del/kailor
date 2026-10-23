# Pricing, homepage capabilities and Timeline retirement — 23 October 2026

## Public publication changes

Timeline is intentionally disconnected, not deleted. The shared Pages inventory, route metadata and prerender inventory no longer publish it. No active public CTA points there. `/timeline` and `/timeline/` redirect Home without importing the Timeline component or looking up an account: App treats retired paths separately from published pages. The local production preview and documented nginx configuration return a noindex 308 redirect for both paths. Deploy that configuration, or equivalent redirects on another host. A SPA host still needs the normal fallback for the client redirect to run.

Timeline is absent from generated assets and prerendered pages. Robots continues to allow crawlers to see redirects; the sitemap remains homepage-only under the existing indexing policy. All other public destinations and private noindex behavior remain. No backend, database, payment, subscription, auth or actual application changes were made.

Introduction's action is now “Explore what we've built” at `/#what-weve-built`. Careers replaces its single Our timeline link with the same capability destination; Contact already had no Timeline link and remains unchanged. The shared homepage-section inventory includes What we've built between Perspective and Activity, so sidebar/footer links inherit it without separate arrays.

## One permanent capability gallery

`frontend/src/pages/Public/Home/WhatWeveBuilt/` owns WhatWeveBuilt, CapabilityGallery, CapabilityReveal, CapabilityDetail, their CSS and canonical `capabilities.ts`. The live section is directly after Perspective and before Activity. No other homepage section moved or was rewrapped.

The gallery retains the archive's four interface studies: Discovery pills, Analysis findings, Solution Canvas tile and project workspace/mascot context. White rounded surfaces, asymmetric two-column offsets, internal typography, hover lift, scroll float/fade and staggered settling remain. The heading uses the adjacent homepage's editorial scale. Tablet/mobile preserve the original stacked layout and restrained spacing. Selectors are now built-/capability-/what-weve-built-scoped; the homepage imports no Timeline implementation or styles.

All Timeline source paths, supporting CSS, milestone content and other components remain. EvolutionArchive and TimelineDetail are compatibility adapters to the extracted gallery/dialog, while timelineData re-exports the canonical capability array and aliases its detail type. There are no duplicate capability descriptions or independently maintained dialog behaviors. The retired page can be restored by reconnecting routing/publication, with the shared gallery available through its adapter. Its standalone source tests continue to run.

CapabilityDetail uses the shared ModalClose, a native portal dialog, keyboard containment, Escape, outside-backdrop dismissal, body-scroll restoration and trigger focus restoration without scrolling. The shared ConversationModal still works after closing capability details. Global section hash navigation already handles direct entry, same-page/cross-page navigation, lazy route return, sidebar dismissal and the 105px section offset; no competing scrolling implementation was added.

## Pricing

Pricing now contains:

- An editorial opening with PageBack and the requested scope-based introduction.
- Three consistent engagement cards: Discovery & direction, featured charcoal Design & delivery, and Ongoing improvement. Each has a small functional icon, bounded description, pricing-method label, scope metadata, aligned CTA and concise features. The first/third use soft-neutral/white surfaces; the featured CTA uses white. Hover lifts are small, pointer-appropriate and disabled for reduced motion.
- Defined around the work, three scope considerations and compact enquiry/scope/proposal/agreement pills. The copy makes clear that a public enquiry does not commission work.
- Three keyboard-accessible native pricing questions, a link to Common questions, and a closing conversation invitation plus the existing Try kailor link.

Every pricing action—Discuss your needs, Start a project, Let's discuss and Start a conversation—opens the existing shared ConversationModal. No account, project, purchase, payment or subscription is created. No amounts, discounts, availability promises, response times or most-popular claims are invented. Existing CostEstimate records require manual review/vendor quotes, and ConsultancyRequest stores a scope snapshot that does not itself commission work; the public categories deliberately do not map to application products.

Cards/supporting content reuse the archive's restrained reversible reveal language and easing. There is no perpetual motion or automatic feature-list animation. Cards stack below 850px; small labels remain readable without horizontal swipe or overflow. Native questions work without JavaScript. Existing no-js styles keep prerendered editorial/card content visible. Pricing remains noindex and retains its canonical URL, with updated descriptive metadata.

## Files

Added: the Home/WhatWeveBuilt folder, Pricing/EngagementCards folder, Pricing/engagements.ts and focused pricing/capability tests.

Updated: Pricing TSX/CSS; Home composition; Introduction's one CTA; Careers' one helpful link; shared navigation/metadata, App, prerender and preview/launch verification scripts; nginx redirect example; current style guide and affected navigation/route tests. Timeline's three small compatibility/data files now delegate to the extraction; no Timeline file was deleted or emptied.

## Validation

- All-workspace typecheck passed. The final all-workspace build passed with 12 public/auth prerendered routes.
- All 130 frontend tests passed. Coverage includes three scoped cards, featured state, every shared-chat pricing action without purchase/commission requests, scope/questions/closing links, canonical capability identity shared with Timeline, all four illustrations, native dialog focus/Tab/cancel restoration, homepage section order and Introduction replacement, Careers replacement link, lazy Pricing entry and both retired Timeline client redirects without account lookup. The retained Timeline implementation also passes its isolated history/detail tests.
- Launch verification passed: 12 routes and 477 asset references, metadata, links, no active Timeline anchors, canonical gallery placement/four cards, preserved Timeline source paths and absence of retired Timeline asset chunks. No source file was deleted.
- Production Chrome passed 1440/1024/768/390/320px, with stacked mobile cards, aligned desktop CTA rows, readable pricing labels, featured charcoal treatment, shared-chat focus restoration, keyboard-native pricing questions and working Common questions/Try kailor actions. No fixed prices or subscription controls were added.
- Chrome also verified 308 Timeline redirects, no Timeline assets/content, all four gallery dialogs, Escape/Tab/backdrop, body/trigger scroll restoration, shared chat after capability details, direct/same-page/cross-route/sidebar/footer hashes at the 105px section offset, sidebar dismissal, down/up reveal re-entry, reduced motion, narrow gallery layouts and readable content with JavaScript disabled. No real messages, applications, accounts or purchases were created.

The visual review refined long pricing labels and removed the inherited global summary chevron so the pricing questions have one local plus indicator. Historical Timeline implementation records remain unchanged. Apply the updated nginx redirect sample (or an equivalent host rule) on deployment; no production deployment or live enquiry submission is part of this iteration.
