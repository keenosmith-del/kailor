# 015 — Hover, notices and guest exit

Small follow-up changes on top of the existing uncommitted refinements:

- Collapsed navigation tooltips use a rounded, translucent white surface with 12 px backdrop blur.
- White buttons retain their previous white fill. Hover adds a slight lift and soft shadow; no outline/ring is added. Cream and charcoal controls retain their palettes. Chat prompts and other white controls are covered.
- Error notices use crisp white, a soft shadow and 24 px rounding, with no border. The X dismisses the current notice, has no hover background and only darkens on hover. A later changed error can appear again. Authentication uses the same ErrorBox component.
- Guest identity options now include **Exit guest session**. The existing shared confirmation dialog explains that discard is permanent and offers Cancel. It uses the new guest-only `POST /api/guest/logout` with `{discard:true}`. The endpoint locks/revalidates the guest principal/session, deletes that guest's active and archived projects, conversations, answers, evidence, reports, sources, preferences, audit rows and unreferenced subjects through existing relations, revokes guest access and clears the guest cookie. Missing/stale credentials are harmless. Account identity is never inferred from the account cookie for this action.
- The response returns discarded session IDs so only guest drafts are cleared in this browser. Account drafts/projects/login and projects previously transferred to an account remain untouched. Successful exit returns to Introduction. Guests still have temporary server-side working state while exploring; signing in and explicitly transferring a project retains it in an account. This change does not silently transfer or save discarded guest work.

No dependency or schema changes were needed for this follow-up. Changes remain unstaged and uncommitted.

Verification executed:

- 19 frontend tests passed, including guest exit dispatch and notice dismissal/reappearance.
- 156 integration tests passed across 10 files. After refining the exit response to scope local draft cleanup, all eight guest lifecycle tests were rerun successfully. The exit regression checks consent, deletion of active/archived guest work/report/source/subject/token/audit rows, fresh entry without prior context, and preservation of account login/projects/transferred reports.
- All-workspace typecheck and full production build passed after the final changes.
- Browser checks confirmed original white fills, rounded 999 px/blurred tooltips, white hover with slight lift, exit confirmation/cancellation without discarding the QA project, and white borderless notices with working X dismissal. Exit deletion was tested only against synthetic isolated database fixtures, not through the live browser confirmation.
- `git diff --check` passed. Legacy test outputs in tracked `.cache` files were restored with read-only Git access and normal writes.

Local proof of the new notice is `.cache/qa/white-message.jpg` (a deliberately missing synthetic session used to show the error component). Keyboard focus indicators remain available; the removed outline refers to visible notice borders and hover rings.
