# kailor experience design — iteration 002

The public-facing journey is an immersive cream/off-white editorial composition. React, Motion, Router, Vite and Tailwind remain the existing stack. `styles.css` centralizes cream, charcoal, paper, muted text, glass, spacing and radius tokens. There are no decorative dividers, uppercase kickers, grey cards, dark panels or heavy shadows. Thin white edges and light blur belong to interactive bubbles only. System Helvetica/Arial provides Swiss-inspired typography without a remote font dependency.

## Introduction

Three native snap-scroll sections use `100svh` with minimum heights for compact displays. The intro owns a keyboard-focusable vertical scroll container with `scroll-snap-type: y mandatory`, per-scene `scroll-snap-align: start`, and smooth native scrolling; below 650px viewport height it relaxes to proximity snapping so taller content stays reachable. Discovery keeps ordinary page scrolling. Elements are independently positioned rather than inside a conventional hero card. Scene one alone displays `k ᐧ ai ᐧ lor` as its primary heading and the supplied mascot head. Supporting copy directly explains discovery for building, improving, automating and launching. Scene two is a right-weighted typography composition; scene three is left-weighted with the discovery action. A single persistent top navigation shows honest, aria-disabled coming-soon account controls across all three scenes. Only scene three has the Start Discovery action; no scene has a skip button. There is no global header/footer on this story.

Each Scene uses `useScroll` with start/end viewport offsets and `useTransform` opacity/vertical movement. The first scene stays visible on entry, then dissolves as it leaves. Following scenes enter as they approach the middle of the viewport and fade toward departure. The head has restrained independent movement. There is no JavaScript scroll interception, infinite pulse or artificial delay. CSS provides native snapping, and Motion observes the same scroll container. Reverse scrolling follows the same progress functions.

## Discovery and shared navigation

Desktop uses a left mascot and a lower-right content area. Choices are compact glass pills (12px text, 36px minimum height) matching the established button surface and transform-only hover; free text uses thin off-white input surfaces. Single-choice selection persists immediately, fades other choices during the actual request, and advances only after server acceptance. Submitting an answer first compresses the clicked pill or Continue button, then briefly expands it before shrinking and fading it away over 340ms. Saving runs alongside this feedback; the next question appears only after the feedback and successful save finish. The question panel and supporting links then fade and scale forward from 96% over 400ms, while the mascot crossfades poses in a fixed desktop anchor outside the animated panel. On mobile the mascot keeps its own reserved area above the question. Multi-select pills show press feedback but remain available until Continue submits the response. Reduced-motion users advance without the pop or delay, and failed saves restore the control. Exiting content is inert. Start again retains its compact glass style: 11px text, 6px × 12px padding, a 30px minimum height, and a reset icon on the left. The conversation link has a chat-bubble icon and reads “Have a conversation instead?”. Multi-choice/text require Continue. An existing selected single answer can be continued again when revisiting or retrying. Errors preserve current input. Backend definitions and option IDs remain authoritative; the first-screen labels are a presentation mapping over those IDs.

No decorative step counters or progress bars are rendered. Back provides editing; the answer-review drawer has been removed. Minimal sentence-case contextual navigation shares the same session across guided discovery, conversation, separate canvas and analysis. Restart creates a fresh session and preserves the old one.

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
