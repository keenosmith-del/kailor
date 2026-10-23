# Light homepage refinement and amended publication — 23 October 2026

This iteration follows both supplied briefs. The additional requirements override the earlier request for a Pricing CTA and the previous gallery placement. The working tree already contained the preceding Pricing/capability extraction; those local changes were preserved except where this amendment explicitly supersedes them.

## Publication and homepage order

Pricing is retired along with Timeline. It has no sidebar/footer entry, public CTA, active route metadata or prerender entry. The unreferenced public Pricing folder was removed, including its old shells; customer application plans, billing, backend and database were untouched. Legacy uncomposed ContactLinks/EngagementSection links now point to Contact. `/pricing` and `/pricing/` use the same client redirect and no-account-lookup retirement boundary as Timeline. The production preview and nginx sample return a noindex 308 to Home. Deploy those host rules (or equivalent) with the build. The sitemap remains homepage-only under controlled indexing.

The shared Pages entry immediately after How it works is now **Try it out**, still `/try-kailor`. Both sidebar and footer inherit that single label/destination. Disabled Our Work/Our Team remain. Only the existing charcoal Common questions action follows the complete service stack; no Pricing button was added.

Home now orders Collaboration's existing SectionReveal, WhatWeveBuilt, ClientPerspectives, Perspective and Activity. The capability gallery was moved once, not copied or redesigned. Production still excludes the unverified ClientPerspectives material. Shared homepage-section navigation follows the same order, with What we've built immediately after Collaboration. The ID/hash, four illustrations, dialogs, hover and reveal implementation remain unchanged.

## Technology capsules

Marquee.tsx now renders horizontal icon/logo-and-name capsules without laurel markup. All 43 original entries remain: 12 capabilities and all 31 local technology SVGs, each once per canonical group. Their typed inventory moved to Marquee/marqueeData.ts so technology breadth is grounded in the same data. No SVG asset or mascot was replaced, no remote image dependency was added.

Marquee.css uses white, 54–58px natural-width capsules, 24–26px optical logo slots, 12px names, soft shadows and consistent gaps. Two equal padded groups retain the 85-second seamless half-track loop. Edges dissolve softly; fine-pointer hover gently lifts a capsule and pauses the track without restarting it. Reduced motion hides the duplicate visual group and offers a focusable horizontal scroller. The duplicate remains hidden from assistive technology. Explicit logo dimensions avoid geometry changes as assets load.

## White services, unchanged mechanics

All four outer service surfaces are crisp white on soft white. Shadows distinguish stacked panels and smaller floating layers. Heading/body/secondary text is charcoal/muted dark; discovery/direction, software toolbar/sidebar/status, automation rows and their states are white or near-white. Existing illustration structure/copy and service order remain. A single 29px local `/kailor-head.png` replaces the direction note's small arrow; mascots were not added to every panel.

Cloud uses the exact outer white surface variable, without an inset contrasting box. Only the trailing period was removed from the original six-word typography sequence. Words, 1650ms cadence, fade/upward blur transitions, sizes and layout remain; no MP4/poster/video layer was introduced. Consultancy (3600ms), workspace (3900ms), automation (1500ms) and all visibility-aware interval cleanup remain unchanged.

Sticky position, top offsets 96/111/126/141px, scale/depth, z-order, original dimensions, surrounding scroll container, reveal timing and mobile/reduced-motion alternatives were retained. No transformed/overflowing parent was added around the stack. ServicesSection only changes its surrounding background; its one existing Common questions action stays outside StackedPanels.

## Activity root cause and correction

Before changing the code, Chrome at 390×700 reproduced the reported reset near the footer. While the parent remained fully opaque, previously entered pills moved back toward `translateY(35px) scale(.94)` and partial opacity. Moving down then up repeated the reset. A tall desktop viewport did not reproduce it because the footer could not move the pills far enough out of view.

The original repeated `whileInView` at 40% observed the same moving pill that owned its entrance and hover `y`/`scale`, below a scroll-transformed parent. Intersection exit could restore the initial variant, then restart its stagger, including while hover and the parent's exit were changing geometry.

Each pill now has a stationary CSS grid slot observed once per mount, a separate animated entrance wrapper, and the original inner pill surface owning hover only. Once entered, the wrapper animates to its settled state and never resets at viewport exit. Parent opacity/vertical scroll motion still provides reversible section entry/exit. The six texts, alternating surfaces, grid offsets, dimensions, bubble shapes, shadows, stagger and responsive arrangement are preserved. A fresh page mount gets a fresh entrance. Reduced motion is static and visible. No arbitrary delay, duplicated timer or complete animation removal was used.

## Grounded, maintainable metrics

Home/homeMetrics.ts centralises labels, values, descriptions, kinds, count policy and internal evidence notes. New commercial figures should only be added with verified business records; no clients, revenue, delivered-project counts or commissioned outcomes were fabricated.

Introduction retains its one featured/two supporting layout:

- Engineering foundation — **6+**, owner-provided experience predating the company.
- Established in — **2025**, a literal founding year with no count-up.
- Built capabilities — **4**, implemented Discovery, Analysis, Canvas and independent workspaces.

The year has a local responsive numeral size so four digits fit the supporting card. Existing count-up remains for experience/capability counts. Other typography, surfaces, scroll and hover treatment remain.

Perspective retains four cards and its original typography/motion:

- Technology breadth — **31+**, derived from the actual technology inventory, not a count of paying-client deployments.
- Connected project journey — **5**, describing Discovery, Analysis, recommendations, consultancy and separately commissioned implementation.
- Independent project context — **1:1**, describing per-project isolation.
- Decisions worth keeping — **PDF**, reflecting existing saved assessments/report exports.

Descriptions communicate technical scope, project continuity and reviewable decisions. They do not imply that the existing website or customer application still needs building.

## Validation

- All-workspace typecheck and build passed; 11 public/auth routes are prerendered.
- All 130 frontend tests passed, including inventory/asset identity, capsule content/accessibility, technical metrics and non-animated date, all four original services and period-free cloud, six separated Activity surfaces, shared navigation/order, both Pricing retirement paths without account lookup, and the preserved capability dialogs/legacy Timeline adapters. Old cloud expectations were updated for the explicitly removed period; obsolete Pricing UI tests were replaced with retirement coverage.
- Launch verification passed: 11 routes/386 asset references, no published Pricing/Timeline metadata or anchors/assets, preserved Timeline sources, new gallery order, complete technology inventory, metric values, no laurel markup, no cloud video/poster and original period-free typography.
- Production Chrome passed 1440/1024/768/390/320px: capsule sizing/inventory, equal group geometry and exact loop displacement, actual motion/hover pause, white outer/internal service layers, original sticky overlap offsets, readable fitting figures/text, the original cloud word sequence cycling without periods, single moved gallery, sidebar/footer Try it out and hash/route return.
- Activity was fully entered and repeatedly scrolled around the narrow footer threshold. All six entrance wrappers stayed opaque/settled and their visual positions relative to the grid remained constant, including rapid direction changes. Reduced-motion screenshots covered every size, static mobile services, all six pills and the unchanged gallery. No real messages, accounts or purchases were created.

No production deployment was performed. Apply the updated redirect rules when deploying. Historical iteration 025 documents the earlier Pricing build and former gallery position; it is intentionally retained as history and superseded here.
