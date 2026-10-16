# kailor visual style

This is the user's preferred visual direction, established through the October 2026 refinements. Use it as the default reference for future kailor interface changes. It is a living baseline: later explicit adjustments take priority. Update this document when a new preference is agreed.

**Thin. Minimal. Modern. Clean. Compact. Rounded.**

The interface should feel light and deliberate. Use restrained typography, crisp whites, small controls and quiet interaction feedback. Give content enough room without wasting vertical space. Preserve the kailor identity rather than introducing another design language or framework.

## Backgrounds and colour

All page backgrounds use the same whitish colour, **`#fafafa`**, through `--page-background`. This includes **Solution canvas, the application shell, surrounding empty space and the footer**. Do not give Solution canvas a different cream page background.

Content surfaces and buttons can be crisp **`#ffffff`**, visibly distinct from the page background. White should look fresh rather than yellow, muddy or greyed out.

| Role                                       | Direction                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Page and footer                            | Consistent `#fafafa`                                                                                    |
| White buttons, fields, prompts and notices | Crisp `#ffffff`                                                                                         |
| Main text                                  | Existing charcoal, approximately `#302f2a`                                                              |
| Secondary text                             | Muted, readable and quiet                                                                               |
| Charcoal buttons                           | Preserve their existing palette unless explicitly asked to change it                                    |
| Cream accents                              | Small, intentional accents such as Continue; preserve approved cream buttons                            |
| Canvas accents                             | Restrained warm selected-node accents may remain; the page background must still match every other page |

Cream is an accent, not the default fill for every prompt, card, notice or page. Avoid repeating warm yellowish surfaces until the whole application feels heavy.

## Typography

Use the existing **Helvetica Neue, Helvetica, Arial, sans-serif** family. Keep headings restrained, with modest negative tracking and deliberate weight.

The top-left **kailor** wordmark should be **small and carry some weight**: the current reference is **16 px, weight 550, tracking −0.035 em**. Use the same treatment across the sidebar and workspace views, including Solution canvas. Do not enlarge it into a prominent page heading or make it thin and oversized.

Navigation and metadata should remain compact. The present sidebar reference is 12 px navigation/project text, 11 px conversation text and 9 px dates. These are starting values, not reasons to sacrifice readability or accessibility.

## Buttons and hover

**Buttons are rounded pills. Keep them rounded when making them smaller.**

Use less padding and smaller type rather than turning buttons into square or boxy controls. Rounded content cards and fields are separate from the pill-button rule.

White buttons must remain recognisable as buttons at rest. **Do not dim their fill to match the page background just to manufacture a hover difference.**

For white and whitish buttons on Chat, Discovery and other pages:

- Keep the approved white resting fill.
- On hover, make the white feel brighter through a very subtle shadow and slight lift/scale.
- The current reference is `translateY(-1px) scale(1.015)` with a soft `0 3px 12px #0000000c` shadow.
- Do not add a visible outline, ring or bulky border to create the hover effect.
- Avoid large motion, dramatic shadows or a yellow hover wash.

Charcoal and cream controls retain their existing colours and hover behaviour unless a change is explicitly requested. A request to improve white-button hover is not permission to recolour every button.

Sidebar controls are quieter: transparent backgrounds, slightly darker icons/text and restrained movement. Avoid filled hover pills on sidebar links, project rows and account controls.

Respect reduced motion. Preserve a discreet keyboard focus indication; removing decorative outlines must not make keyboard navigation invisible.

## Sidebar and tooltips

The collapsed rail and expanded drawer are two states of one component. The ellipsis opens and closes it at the same position, aligned with the navigation icons. Expansion overlays content without shifting it. Backdrop and Escape dismiss it, with keyboard focus managed correctly.

Keep the sidebar dense enough to scan:

- Tighten gaps between items and sections.
- Put conversation dates **beside the title on the same line**, with a small gap. Never give each date its own row.
- Use a short visible date, such as `16 Oct`, while retaining the full timestamp accessibly.
- Truncate long titles rather than making the list taller; retain full accessible labels.
- Keep project conversations independently collapsible and initially collapsed.
- Place the conversation **(+) beside the rename pencil**, not in a full “+ New conversation” row below the list.
- Keep a separate project **(+) beside Projects**.
- Keep profile/account controls consolidated at the bottom.

Current desktop references are 36 px navigation rows and 32 px conversation rows. Coarse-pointer controls retain 44 px touch targets. Compact appearance must not make touch controls difficult to use.

Collapsed-item tooltips use **rounded, translucent white with backdrop blur**. Current reference: pill rounding, white at 72% opacity, 12 px blur and a very soft shadow. They should feel like small frosted labels rather than square opaque boxes.

## Chat

Chat is a viewport-contained workspace. The transcript scrolls inside its own area and **must never extend behind or below the message bar**. Keep status messages visible above the composer instead of burying them at the end of the scrollable transcript.

The composer should be thin, polished and cohesive:

- Approximately 44 px high for a single-line draft.
- Rounded pill shape.
- Send arrow and its background sit neatly inside the bar.
- A minimal **(+) on the left** opens document attachment.
- Longer drafts can grow within a bounded area.

Use the actual supported attachment workflow. Currently it accepts UTF-8 TXT/CSV up to 64 KB each, stored with the project's Sources. Do not imply support for binary PDF/Word extraction without implementing it.

When clearing an already-empty conversation, show the notice above the composer and **dismiss it after three seconds**. Clicking Clear again restarts the timer.

## Discovery

Discovery should fit within the viewport with its ordinary question, field and actions visible. Avoid oversized mascot space, tall textareas, excessive section gaps and controls that require scrolling the entire page into position.

Use small, clean textareas and restrained field edges. The current text-field reference is about 88 px high. **No bulky border or large focus outline when entering text.** Use a subtle focus treatment and keep typing comfortable on mobile.

Continue, I'm not sure yet, Skip and Back remain small **pill-shaped** controls with minimal padding. Continue can retain its cream accent.

Do not show **Start from beginning** when the user is already at the first question, including when revisiting the starting situation. After progress, restart opens a clean in-app confirmation modal—never a browser alert/confirm dialog.

On smaller or zoomed screens, use bounded internal scrolling as an accessibility fallback rather than hiding controls or allowing the whole workspace to overflow. The current mobile layout omits the large mascot to preserve room for the question.

## Notices and confirmations

Service errors and similar message bubbles use:

- Crisp white against the whitish page.
- Rounder corners; the current reference is 24 px.
- A very subtle shadow to distinguish the bubble from the background.
- **No visible outline or border.**

Provide a minimal **X** to dismiss a notice. On hover, the X **only becomes slightly darker**: no background fill, shadow, ring, scale or jump. The current icon colour reference is `#858585` to `#454545`.

A newly changed error may appear again after an earlier error was dismissed. Do not globally suppress later errors.

Confirmation modals should be clean, compact and rounded, with clear wording, Cancel and the specific action. Trap focus, support Escape/backdrop cancellation when safe, restore focus, and prevent duplicate submissions while processing.

Guest identity controls include **Exit guest session**. Its confirmation clearly explains that temporary guest work will be discarded rather than saved to an account. Account retention requires signing in and explicitly transferring a project; guest exit must not affect account projects, login or drafts. Temporary working state during exploration is distinct from keeping a project in an account.

## Making future adjustments

Keep changes small and reviewable. Apply a requested colour or hover change to the intended class of surfaces rather than changing the entire palette. Preserve the existing application behaviour and data isolation. Leave changes uncommitted when requested.

Before delivering a visual refinement, inspect the actual desktop and mobile result. Check long text, inline metadata, hover, keyboard focus, notice dismissal and viewport containment where relevant. Report only checks actually executed.

## Implementation references

- [Shared colours and controls](../../frontend/src/styles/global.css)
- [Application shell and workspace styles](../../frontend/src/pages/Application/ApplicationWorkspace.css)
- [Sidebar](../../frontend/src/components/ApplicationSidebar/ApplicationSidebar.tsx) and [sidebar styles](../../frontend/src/components/ApplicationSidebar/ApplicationSidebar.css)
- [Conversation history](../../frontend/src/pages/Application/ConversationHistory.tsx)
- [Chat](../../frontend/src/pages/Conversation/Conversation.tsx) and [Chat styles](../../frontend/src/pages/Conversation/Conversation.css)
- [Discovery](../../frontend/src/pages/Discovery/Discovery.tsx)
- [Dismissible notices](../../frontend/src/components/ErrorBox/ErrorBox.tsx) and [notice styles](../../frontend/src/components/ErrorBox/ErrorBox.css)
- [Confirmation dialog](../../frontend/src/components/ConfirmDialog/ConfirmDialog.tsx)

The iteration documents in [docs/iterations](../iterations) record implementation history and executed checks. This README records the current preference, including later corrections; it takes precedence over an older iteration's superseded visual description.
