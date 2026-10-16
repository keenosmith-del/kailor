# 013 — Minimal workspace controls

Refines the existing application in place and retains the previous uncommitted sidebar/guest-journey changes.

## Visual and interaction changes

- Shared workspace wordmark: 16 px Helvetica Neue/Helvetica/Arial, weight 550, restrained tracking. The same navigation component brands Chat, Discovery, Canvas and other workspace views. Guest entry uses the matching smaller weighted mark.
- Compact buttons retain their rounded pill silhouette. Hover adds a subtle lift/scale and tonal colour change: cream becomes brighter white, warm beige becomes a warmer beige, and primary charcoal becomes a brighter charcoal. Sidebar controls retain transparent backgrounds with colour/movement feedback. Reduced-motion overrides remain active. Form fields stay thin and compact rather than acquiring large focus rings.
- Each project's conversation (+) sits beside its rename pencil. The former full “New conversation” row is removed. The Projects heading retains its own (+): accounts open project creation; guests open the explicit safe journey chooser. Project IDs still determine new-conversation context; errors keep the drawer available.
- Chat uses a bounded flex layout: only the transcript scrolls, with notices and composer in separate rows. Empty-clear feedback appears above the composer and disappears after three seconds. Repeated clicks restart its timer; unmount/session changes and message sending clean up the transient notice. Provider notices have their own state.
- The composer is 44 px high for a single-line draft, with an inline left attachment (+), growing textarea and flush send control. Long drafts and transcripts stay bounded. The attachment button uploads through existing project Sources and reports success/failure without discarding the draft. Existing upload capabilities apply: UTF-8 TXT/CSV, 64 KB each; binary PDF/Word extraction was not added.
- Discovery shares the viewport with its header/footer. Desktop keeps a contained mascot/question composition; mobile omits the large mascot to preserve space. Smaller question typography, 88 px text fields and compact actions fit the tested screens. Small/zoomed screens and unusually long content retain a bounded question scroller rather than clipping controls or scrolling the entire document. Coarse-pointer controls keep 44 px targets.
- Restart is absent at the first question, including when revisiting the starting situation. It appears after progress and opens the reusable `ConfirmDialog` portal instead of `window.confirm`. Cancel/Escape/backdrop preserve work. Confirmation clears only existing guided Discovery context through the unchanged restart endpoint; Chat-confirmed facts, conversations, sources and reports remain. The dialog inerts the app, traps focus, prevents dismissal while saving and restores focus on close.
- Settings, Account, Sources and Canvas inherit thinner controls and restrained typography; Canvas nodes remain rounded cards. Introduction/authentication designs and intelligence behaviour are preserved.

## Components

`ApplicationSidebar`, `ConversationHistory`, `ApplicationWorkspace`, `Conversation`, `Discovery`, `SessionPage`, the new `ConfirmDialog`, and the guest-entry wordmark styling. No backend/schema/API changes were required for this visual refinement.

## Executed verification

- Backend unit suite: 291 passed.
- Frontend DOM tests: 17 passed across two files, including the final three-second timeout/repeated-click regression.
- All-workspace typecheck passed.
- Full shared/backend/frontend build passed; the final frontend build/typecheck/tests were rerun after the pill, wordmark and timeout changes.
- `git diff --check` passed. All changes remain unstaged/uncommitted.

Frontend tests cover project action placement/new-project controls, conversation context selection, empty-clear feedback outside the scrollable transcript, its precise 3-second timeout and timer reset, document success/error/draft preservation, restart visibility, modal focus wrapping/dismissal/busy handling, and confirmation-before-reset/cancellation without a POST. Previous sidebar/guest tests continue passing. Backend integration suites were not rerun for this frontend-only follow-up; their prior results are documented in iteration 012.

Browser verification used only the existing synthetic QA guest and a local API forced to mock AI:

- Desktop 1440 × 800 and mobile 390 × 844: document height equalled viewport height for Chat and Discovery; no page scroll was needed to reveal ordinary controls.
- Empty-clear status sat immediately above the composer. The composer measured 44 px high; the mobile notice ended at y=760 and composer occupied y=760–804, inside the 844 px viewport.
- A long synthetic transcript had scroll height 2608 px within its bounded history. At 390 × 568, the transcript ended at y=455.5, composer started at y=484 and ended at y=528; the document remained 568 px tall.
- Discovery's text question fit completely on mobile: question scroll/client heights were both 342 px. The textarea measured 88 px high; its focused outline computed `none 0px` with only a subtle 1 px field edge. Cancel retained the draft; confirming restart returned to the first question without a restart control.
- Verified the 16 px/550 wordmark and adjacent pencil/conversation-plus/project-plus controls. The final pill silhouettes and tonal hover rules were inspected after the user's correction.
- Uploaded `kailor-visual-note.txt` through the actual attachment chooser and observed the project Sources success status. The in-app browser required native browser input to open its chooser; a DOM click alone did not produce a chooser event. No live model request was made.
- Saved desktop proof at `.cache/qa/minimal-chat.jpg`.

These are local visual/interaction checks, not assistive-technology certification. Software keyboard behaviour and every browser/zoom combination were not emulated; dynamic viewport sizing and bounded overflow remain the fallback for constrained displays.
