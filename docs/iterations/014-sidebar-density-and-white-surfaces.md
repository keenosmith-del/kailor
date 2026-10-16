# 014 — Sidebar density and white surfaces

Conversation dates now sit beside their title on one line, using a short day/month label. The full timestamp remains in the accessible button label and time tooltip. Titles truncate without wrapping or displacing the date.

Desktop sidebar page rows are 36 px, conversation rows 32 px, and excess section/list margins have been reduced. Coarse-pointer controls retain 44 px touch targets. Project selection, new-project/new-conversation actions, profile controls and keyboard behaviour are unchanged.

Prompt chips, messages, fields and ordinary workspace surfaces now use crisp white/neutral fills. Pill silhouettes and subtle hover movement remain. Warm accents are intentionally retained on Continue and similar primary actions. **The canvas retains its warm background and selected-node accents**, following the user's clarification; it was not converted to an all-white canvas. The Introduction/authentication background was preserved.

Native filled disclosure markers are replaced globally by thin border-drawn, unfilled chevrons. They rotate when open without changing native details/summary semantics. Existing sidebar Lucide chevrons use thinner strokes.

Executed verification:

- 17 frontend tests passed.
- All-workspace typecheck passed.
- Frontend production build passed, including a final rebuild after restoring the canvas palette.
- Browser measurements: title/date share one row with a 7 px gap; conversation rows 32 px; page rows 36 px; prompt backgrounds `rgb(255,255,255)`.
- Canvas background computed `rgb(250,247,240)` and its selected node `rgb(244,238,227)`, confirming the retained warm palette.
- Settings disclosures computed no native marker, a transparent chevron fill and thin top/right strokes; expanding still revealed the content normally.
- `git diff --check` passed. Changes remain unstaged and uncommitted.

Desktop proof: `.cache/qa/compact-sidebar.jpg`. Responsive touch sizing was inspected in CSS; this small follow-up did not repeat the earlier full mobile workflow or backend integration suite.

## Follow-up: shared page background

The latest clarification supersedes the warm canvas page background above: all page canvases and the footer now share `--page-background: #fafafa`. The Solution canvas exception was removed. Warm control/selected-node accents remain separate from the page background. Frontend build and `git diff --check` passed after this change.
