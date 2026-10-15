# kailor experience design — iteration 002

The public-facing journey is an immersive cream/off-white editorial composition. React, Motion, Router, Vite and Tailwind remain the existing stack. `styles.css` centralizes cream, charcoal, paper, muted text, glass, spacing and radius tokens. There are no decorative dividers, uppercase kickers, grey cards, dark panels or heavy shadows. Thin white edges and light blur belong to interactive bubbles only. System Helvetica/Arial provides Swiss-inspired typography without a remote font dependency.

## Introduction

Three native snap-scroll sections use `100svh` with minimum heights for compact displays. The intro owns a keyboard-focusable vertical scroll container with `scroll-snap-type: y mandatory`, per-scene `scroll-snap-align: start`, and smooth native scrolling; below 650px viewport height it relaxes to proximity snapping so taller content stays reachable. Discovery keeps ordinary page scrolling. Elements are independently positioned rather than inside a conventional hero card. Scene one alone displays `k ᐧ ai ᐧ lor` as its primary heading and the supplied mascot head. Supporting copy directly explains discovery for building, improving, automating and launching. Scene two is a right-weighted typography composition; scene three is left-weighted with the discovery action. A single persistent top navigation shows honest, aria-disabled coming-soon account controls across all three scenes. Only scene three has the Start Discovery action; no scene has a skip button. There is no global header/footer on this story.

Each Scene uses `useScroll` with start/end viewport offsets and `useTransform` opacity/vertical movement. The first scene stays visible on entry, then dissolves as it leaves. Following scenes enter as they approach the middle of the viewport and fade toward departure. The head has restrained independent movement. There is no JavaScript scroll interception, infinite pulse or artificial delay. CSS provides native snapping, and Motion observes the same scroll container. Reverse scrolling follows the same progress functions.

## Discovery and shared navigation

Desktop uses a left mascot and a lower-right content area. Choices are compact glass pills (12px text, 36px minimum height) matching the established button surface and transform-only hover; free text uses thin off-white input surfaces. Single-choice selection persists immediately, fades other choices during the actual request, and advances only after server acceptance. Submitting an answer first compresses the clicked pill or Continue button, then briefly expands it before shrinking and fading it away over 340ms. Saving runs alongside this feedback; the next question appears only after the feedback and successful save finish. The question panel and supporting links then fade and scale forward from 96% over 400ms, while the mascot crossfades poses in a fixed desktop anchor outside the animated panel. On mobile the mascot keeps its own reserved area above the question. Multi-select pills show press feedback but remain available until Continue submits the response. Reduced-motion users advance without the pop or delay, and failed saves restore the control. Exiting content is inert. Start again retains its compact glass style: 11px text, 6px × 12px padding, a 30px minimum height, and a reset icon on the left. The conversation link has a chat-bubble icon and reads “Have a conversation instead?”. Multi-choice/text require Continue. An existing selected single answer can be continued again when revisiting or retrying. Errors preserve current input. Backend definitions and option IDs remain authoritative; the first-screen labels are a presentation mapping over those IDs.

No decorative step counters or progress bars are rendered. Back provides editing; iteration 003 adds a simple Review your answers disclosure using the existing text-link/button styling. Minimal sentence-case contextual navigation shares the same session across guided discovery, conversation, separate canvas and analysis. Restart creates a fresh session and preserves the old one.

Completion and assessment preparation do not redirect. Preparation shows actual processing feedback; a current snapshot enables the explicit Explore the analysis link. Any later session revision invalidates readiness. The report retains seven sections, sentence-case headings, named section controls, focus/arrow keys, touch swipe and PDF export. Content is unboxed and editorial. Canvas retains real existing/core/optional/future projections and dependency details.

## Static mascot assets

`mascot-assets.ts` maps only supplied files. Head: `heads/kailor-head-neutral.png`. Greeting/attentive/conversation/completed use `poses/kailor-neutral.png`; curious uses `poses/kailor-confused.png`; thinking/recommendation use `poses/kailor-pensive.png`. Discovery starts with `kailor-neutral.png` and cycles through every file in `public/mascot/poses`: neutral → pensive → confused → impatient → grumpy → unamused → facepalm → hiding → annoyed, then repeats. Accepted responses, edits, skipped answers, and Not applicable advance the pose; simply navigating back does not. All nine images are preloaded. Shared poses are intentional; there is no invented celebrating artwork.

`Mascot` uses fixed contain-fit dimensions and overlapping image crossfades. Missing/unloadable assets leave clean reserved space. Images are decorative with empty alt and an aria-hidden wrapper; interaction meaning is conveyed by text. No GIF, generated artwork or spritesheet is used.

## Responsive and accessible behaviour

At 1000px columns tighten. Below 700px the mascot sits above questions, conversation stacks, navigation wraps and reports become one column. At 380px typography/control spacing adjusts further. Inputs remain usable with ordinary vertical scrolling and safe-area padding. Intro account controls expose unavailability through both text and aria-disabled semantics. Native radio/checkbox controls retain labels and focus indicators. Status/errors use appropriate live semantics.

MotionConfig and `useReducedMotion` remove transforms for reduced-motion users; introduction scenes become immediately visible, mascot/discovery/report durations become zero. CSS also suppresses transitions. Runtime OS preference emulation and formal screen-reader auditing were not performed in this iteration. Physical-device touch/keyboard behaviour needs follow-up; browser viewport resizing is layout verification only.

The browser title is exactly `kailor`. `/kailor-head.png` is an unchanged copy of the supplied neutral head and is linked as the PNG favicon in `frontend/index.html`.

## Established button style

Use the Start Discovery button as the shared button style until further design direction: rounded glass surface, thin white border, subtle blur and shadow, and charcoal text. Hover preserves background and text colors and applies only a slight lift and scale (`translateY(-2px) scale(1.015)`). Keep disabled and keyboard-focus states.

## Discovery control audit

Discovery option pills use the glass surface. Continue, Back, Skip, Not applicable, preparation, and the analysis action use a solid `#33383e` background and cream text; hover changes only the transform. Option pills and solid action controls share 12px text, 8px × 14px padding, and a 36px height; Start again keeps its smaller glass style. Header navigation and the conversation shortcut are text-only, muted at rest, with a slightly darker color and slight transform on hover. The active header item remains charcoal. Restart loads the next session before fading out the previous one and fading in the new opening question, without a loading-screen flash.

Progress, portfolio, presence, website, tools, and booking/invoice/content details can now be skipped, in addition to constraints, budget, and timing. Text detail prompts where the answer may not apply also offer Not applicable. Core starting point, work type, description, branch intent, challenges, and goals remain required. Not applicable is saved as an explicit answer and does not count as positive workflow evidence for recommendations.

Discovery no longer renders the “Understanding what you’ve shared…” message during answer submission. Clicking Prepare the assessment crossfades the mascot to `other/kailor-smiling.png`, which remains through the completed assessment state. A failed preparation restores the previous pose for retry.

Iteration 003 renders the persisted adaptive question plan, exposes preliminary preparation during useful follow-ups and uses normal dynamic conversation prompts plus grouped proposal confirmation. No visual architecture, artwork, palette or report-section redesign was introduced.

## Iteration 004 reliability feedback

Reuse the existing discovery composition, typography, mascot and transitions. Inline validation retains typed text; required text can communicate uncertainty. Exhausted/unsupported discovery presents known context with Tell kailor more, Have a conversation and Start again. Material corrections use explicit confirmation. Report/Canvas actions reflect authoritative eligibility; saved historical reports retain their stale explanation. Review your answers is removed as requested. No introduction, palette, artwork, global style or PDF template redesign was made.

## Iteration 005 interaction-only changes

The composition, typography, cream palette, mascot assets, scroll transitions and report/PDF layout remain. Contextual prompts use existing question controls; suggestions reflect the saved situation and remain available after messages. Unsent text uses tab-scoped, knowledge-revision-scoped session storage with a thirty-minute expiry and pruning on use/visibility/minute timer. Saving/sending/restart/logout clear the appropriate drafts; browser suspension may delay physical cleanup. Founder review adds ordinary form fields, category/dimension checkboxes and expandable source findings/technical inspection within the existing private Workspace. Analysis distinguishes blocked preparation from snapshot freshness. No removed answer-review control or new design system is introduced.

## Iteration 006 Conversation refinement

Only Conversation receives visual refinements: existing static body poses tied to meaningful pending/readiness states, scoped touch sizes/safe-area input padding, a bounded transcript, concise confirmation copy and editable text evidence. React renders message text with preserved whitespace and safe wrapping, without unsafe HTML or a new Markdown renderer.

Suggestions have a typed `kind: message`, short label and explicit draft text. They fill/focus the composer; assessment/navigation actions are separate. Enter submits on fine-pointer desktop, Shift+Enter inserts a newline, and composition events are ignored. Failed submission preserves the draft, successful chat response clears it, and passive session refresh no longer overwrites in-memory unsent text. Existing thirty-minute storage expiry remains. Scroll follows new transcript content only near the bottom. No fake stages, animated dots, typewriter delay or streaming were introduced. Prepared reports offer explicit Analysis navigation while Conversation remains usable.

## Iteration 007 plan navigation

PlanNavigation shows the actual session's plan title and a compact Change plan control. PlanManager provides create/open/rename/archive/restore, paginated plans and previous discoveries, explicit comparison, current understanding, read-only report history and two account-wide default controls. These extend the editorial cream/glass design without replacing the Introduction, Canvas or Analysis.

Session paths remain backwards compatible. Stable plan URLs open the explicitly selected discovery. SessionPage ignores stale route-load results and hides old session content while a new route loads. Drafts remain keyed by discovery/session identity, keep the thirty-minute expiry and never appear in another business. Starting a new discovery preserves the prior session/draft; creation uses stable request keys. Failed switching preserves the route/current valid state. An archived content fieldset disables mutations while leaving navigation and historical links available, without pretending processing is underway.

Conversation offers grounded separate-plan controls (create, keep discussing current plan, cancel). Model text cannot execute those actions. Suggestions remain message drafts, and report preparation/navigation stay explicit. No new artwork, streaming, decorative loading dots or fake processing stages were added.
