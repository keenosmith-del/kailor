# Try kailor — 23 October 2026

## Public experience

`/try-kailor` is a lazy public route with shared layout, PageBack, footer and conversation provider. It asks four visitor-controlled questions, collects the selected pills, briefly gathers/dissolves them and shows the real `/mascot-head.png`, thinking dots, a typed message and a compact possible-direction tile. Expandable details explain why, what to clarify, proper Discovery and the distinction from an agreed proposal. Closing actions link to the existing restricted Create account / Sign in routes, open the shared conversation modal or start another journey. No account availability or transfer of choices is promised.

The opening is an editorial/interactive two-column composition at desktop, with a single column at tablet/mobile. Try it out scrolls/focuses into the first question in the same page; visitors can also choose directly from the preview. Monochrome surfaces, Helvetica Neue, small white/charcoal pills and existing easing stay native to the website. No new framework, generated mascot or backend dependency was introduced.

## Structure and rules

The page lives in `frontend/src/pages/Public/TryKailor/`. Colocated Simulation, Recommendation and SimulationClosing TSX/CSS keep presentation separate from typed `simulationData.ts`, `recommendationRules.ts` and `simulationState.ts`.

1. Situation: business owner, idea, unsure, specific requirement.
2. Four genuinely different focus questions, one per situation.
3. A context question based on the selected focus: workflow, integration, digital experience, AI, technical foundations, early idea or cloud.
4. A priority/scope question appropriate to the original situation.

There are 144 valid four-choice journeys. Seven possible directions are selected deterministically. Limited integration access and unclear AI information lead to technical review; an unclear digital audience leads to idea definition. Context changes the message and next checks, and the final priority changes the next consideration and details. Mentioning technology alone does not recommend AI. Copy is a qualified starting point based on selected choices, never a diagnosis of inspected systems.

## State, animation and accessibility

A reducer owns explicit intro/questions/selecting/summary/dissolving/thinking/typing/complete phases. The selecting phase rejects repeated clicks; guarded phase events cannot advance unrelated states. Back/edit preserve unchanged answers. Changing a choice truncates later answers so stale branch data cannot survive. Continue allows an unchanged saved answer to be reused. Restart clears everything and never loops automatically.

Shared layout IDs move a chosen pill into the compact saved-answer cluster. Outgoing question controls become inert and hidden from assistive technology. Heading focus follows question/result transitions without scrolling the page unexpectedly. A single cleanup-aware phase timeout handles selection, summary, dissolve, thinking and typing. Timeouts pause when the document or simulation is out of view; scrolling does not reset state. Unmount/restart cancels pending work. Reduced motion skips timed transitions and typing while preserving the same outcome.

The typed response uses a hidden full-text sizing layer and matching visual text to reserve its final height. Screen readers receive the full message once, rather than character-by-character announcements. The inline detail region exposes expanded state, supports Escape and restores trigger focus; it is not a dialog and does not trap focus. The existing modal is reused for conversation. A Careers-style noscript fallback keeps introductory copy visible and explains that JavaScript is required for interaction.

## Integration and boundaries

- Shared sidebar inventory adds Try kailor immediately after How it works; the footer inherits it once in Pages. Disabled Our Work/Our Team and homepage-section navigation remain.
- How it works adds one compact charcoal Try it out link beneath its opening paragraph. DiscoverySequence is unchanged.
- Homepage Conversation adds the same established pill beneath its existing description. ConversationVisual and its sequence are unchanged.
- ServicesSection adds a reversible fade containing Common questions immediately after the complete StackedPanels component. No wrapper, stack offsets, sticky rules or panel choreography changed.
- Metadata/prerendering include useful introduction/first-question copy, noindex and the new canonical URL. CSS is included in prerendered HTML. The deployment cache inventory includes the route. Private indexing and homepage-only sitemap remain unchanged.

The simulation has no API, AI, database, session, email, cookie or storage calls. Answers exist only in React state. Refresh or route remount starts fresh. Opening the shared chat or following an auth link invokes those existing features separately; nothing passes simulation answers to them. No backend, account policy, real Discovery or Canvas logic was changed.

## Validation

- All-workspace typecheck and build passed. The build prerendered 13 public/auth routes.
- All 116 frontend tests passed. Rule tests enumerate all 144 journeys and all seven directions, including context-based changes and priority-specific considerations. Reducer tests cover invalid/stale events, rapid clicks, back/edit, preserved unchanged selections and dependent-answer invalidation. Component tests cover the in-page start, gathered answers, full accessible response, details/Escape/focus, restricted-account links, shared chat, restart, no requests/storage and selection-timer cleanup.
- Route tests load the lazy preview without an account lookup. Shared inventory and CTA-placement tests verify the required navigation and the Common questions action outside the four-panel stack. An existing asynchronous sidebar test now waits for its route transition before asserting the new URL, addressing a timing failure without changing application behavior.
- Launch verification passed for 13 routes and 502 asset references, including metadata, canonical URLs, noindex, links, production content and basic credential patterns.
- Production Chrome checks passed at 1440/1024/768/390/320px: direct/refresh entry, no overflow, footer order, branching/back/edit, rapid-click protection, four gathered answers, actual mascot image, three thinking dots, partial-to-complete typing with stable message height, details/Escape/focus, restart and four distinct reduced-motion journeys. All requested public entry links worked; the stack retained four sticky panels and no transformed ancestor. No-JavaScript introductory text remained visible. No simulation API requests or storage writes occurred. Additional lifecycle checks verified heading focus in normal/reduced motion, offscreen typing pause/resume, navigation during thinking followed by fresh remount, actual sticky panel offsets of 96/111px, continuing scripted Discovery, and closing auth links showing closed registration with guest access disabled. No accounts were created.

No production deployment is performed by this iteration. The simulation remains an illustrative frontend starting point; it neither creates a project nor transfers its ephemeral selections to an account. Registration restrictions remain the responsibility of the unchanged existing auth implementation.
