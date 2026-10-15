# Iteration 010 — kai authentication replication

## Reference and visual implementation

Inspected the complete `kai/frontend/src/pages/SignIn/SignIn.jsx`, `SignIn.css`, `frontend/src/index.css`, and the existing GitHub icon, form submission, visibility toggle, mode transition and responsive rules. The reference has no imported UI components or Back control. It places the 150px mascot above the right form and editorial branding on the left; kailor follows the requested variation with the existing `/mascot/poses/kailor-unamused.png` on the left and `k ᐧ ai ᐧ lor` centered above the description on the right. The PNG is unchanged. Back uses kai's quiet 12px navigation treatment with a small existing Lucide arrow.

`Auth.css` copies the reference's equal columns, cream/paper split, 80px left padding, 70px right padding, 390px form width (430px on tablet), Helvetica typography, centered form introduction, 20px form gaps, 9px label gaps, 53px/26px-radius inputs, subtle focus border/inset shadow, 48px pill submit/GitHub controls, hover transitions and error colours. Breakpoints remain 900px and 480px; the left mascot now matches Discovery's responsive image-container dimensions, as requested in the visual follow-up. Selectors override kailor's generic input rules only within authentication. No kai runtime imports, new dependencies, mascot edits or unrelated introduction styling changes were introduced.

GitHub and Continue without account share the same full-width secondary pill style and sit consecutively beneath the primary action. The form sequence follows the request: signup adds Full name and Confirm password before its primary action; both pages then show GitHub, guest entry and the link to the other page. Invitation fields/messages and founder-contact recovery copy are removed. Passwords remain masked by default, with a Show/Hide control and existing 12–128 character signup requirements. Confirmation is checked before sending a request.

## Authentication and persistence

- Existing `/sign-in`, `/create-account`, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, cookies, scrypt hashing, validation, origin checks, rate limits, roles and protected routes are retained.
- Registration accepts optional trimmed `name` (2–150 characters) for API compatibility; the UI requires it. The nullable `AdminUser.name` field is added by migration `202610150003_account_name`; existing records retain null names. Login and account lookup now include the stored name.
- Public self-registration needs no invitation, including installations with the legacy `REGISTRATION_POLICY=invite` value. New installs default to `public`; `closed` remains an explicit registration shutdown. `/auth/policy` reports public or closed. Explicit legacy invitation codes are still validated and consumed atomically for older clients; the new UI never sends one.
- Every registration still creates `role: member`; client role injection is rejected by the strict request schema. Founder tool permissions and invitation issuance remain server protected.
- Guest entry reuses `useDiscoveryEntry({guestOnly:true})`, the independent guest cookie and existing guest discovery/report services. No guest-to-account transfer is introduced.
- **GitHub OAuth is absent in kailor.** Unlike kai, kailor has no provider start/callback endpoints, account linking or provider configuration. Its matching GitHub control is explicitly disabled, with an accessible explanation and tooltip. It does not call kai's backend or simulate success. Enabling it needs a separate real server integration, OAuth app/client ID, server-only client secret, registered callback, state verification and safe account linking. No secrets or environment values were changed.
- Forgot-password/email recovery is neither implemented nor advertised.

## Footer and transitions

The existing single global `Footer` stays in App. Authentication and its footer share a grid: the full-height main spans both rows, while the footer occupies only the bottom-left area. This preserves the right paper panel to the viewport bottom without negative margins, extra strips or footer duplication. The left column already reserves sufficient bottom padding for the footer. On the single-column responsive layout, the footer follows the form in normal flow.

`PageTransition` observes path changes once at App level and runs a 280ms opacity entrance on the existing route main using the Web Animations API. It adds no keyed wrapper, route remount or session reset. The footer remains stable. Introduction scene animations do not change the route and remain untouched; views of the same discovery keep SessionPage's existing crossfade. Reduced motion skips the page animation, and browser back/forward works through the existing router.

## Files

- Rebuilt `frontend/src/pages/Auth/Auth.tsx` and `Auth.css`; added `useAuthentication.ts` to keep form state, confirmation and submission separate from markup.
- Added `frontend/src/components/PageTransition/PageTransition.tsx`; updated `frontend/src/App.tsx`, `styles/layout.css` and `types/account.ts`.
- Updated `backend/src/app.ts`, `auth.ts`, `config.ts`, Prisma schema/generated client and the additive account-name migration.
- Updated `backend/tests/accounts.integration.test.ts`, added `public-registration.integration.test.ts`, and included the new suite in `backend/package.json`.
- Updated `.env.example`, API/design/setup documentation, README and this iteration record.

## Verification

Production build passed. All 134 PostgreSQL integration tests in seven files passed, covering public registration/name persistence, unchanged member/admin boundaries, rejected role injection/invalid names, closed registration, existing invitation clients, login/logout, guest discovery and reports. Tests used only `kailor_test`. The additive migration was applied to the local development and isolated test databases without reset/reseed or credential changes.

Plain `npm test` still encounters the pre-existing moved-draft import in contextual/memory suites. All 274 unit tests pass with the temporary `/tmp/kailor-entry-vitest.config.mjs` alias already used for iteration 009. No unrelated draft modules or tests were changed. No lint script is configured; scoped Prettier and diff checks are used.

Browser checks at 1440×900 verified 390px forms, 53px inputs with 26px corners, one footer, a right panel reaching exactly 900px, and no desktop overflow on either clean form. Tablet 768×1024 and mobile 390×844 preserve the stacked composition, full form visibility through scrolling, and no horizontal overflow. Password mismatch produces the reference-style alert before submission; Show/Hide works. Sign-in/create-account navigation, Back to intro, browser history and guest entry into discovery also passed.
