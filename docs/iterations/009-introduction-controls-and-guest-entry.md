# Iteration 009 — introduction controls and guest entry

## Implementation

The existing three-scene introduction content, positions, supplied mascot, wheel/touch/keyboard navigation and cinematic transitions are retained. The shared footer remains outside all scene transitions. Sign in and Create account remain in the existing persistent top-right navigation; no separate Skip control existed in this implementation.

The account-control gap is 12px on desktop/tablet and 8px on mobile, tightened at the user's request while retaining the existing right edge and comfortable hit areas.

`EntryButton.css` supplies scoped `.entry-button`, `--text`, `--light` and `__arrow` classes. The entry actions have pill corners in every state. Sign in stays transparent; Create account uses the supplied profile SVG. The Scene 3 discovery action has the same light pill styling and a Lucide right arrow. The user refined that action concurrently to “Continue” without the “No account required” note and explicitly requested that concurrent changes remain; those edits are preserved. Only fine-pointer hover lifts buttons and shifts the arrow; reduced motion suppresses movement. Existing global `.button`, `.surface-button` and `--control-radius` rules remain unchanged for unrelated controls.

`useDiscoveryEntry` shares session creation, duplicate-click protection, busy/error handling and navigation between introduction and authentication. Leaving a page during creation prevents a late redirect. Start discovery uses the existing account session when already signed in; otherwise it posts `{}` directly to `/api/guest/sessions` and opens `/preview/:id/discovery`. Authentication pages explicitly offer guest entry without checking/requiring account credentials. Requests that fail for reasons other than unauthenticated status show an error instead of silently switching account identity.

## Authentication and configuration

- `/sign-in`: existing email/password `/api/auth/login`.
- `/create-account`: existing email/password `/api/auth/register`, preserving member roles, validation and the configured registration policy. The existing policy endpoint remains authoritative.
- Both dedicated pages link to each other, the introduction and guest discovery. Existing safe `returnTo` handling and protected routes are retained.
- `REGISTRATION_POLICY=invite` remains the default; founder-issued email-bound invitations are required. `public` enables the existing open registration implementation; `closed` disables registration while guest entry remains available. No environment values were changed by this work.
- **GitHub is not integrated.** There is no OAuth start/callback endpoint, provider configuration, linked-identity schema or account-linking policy in the current backend. No fake or inert “Continue with GitHub” control is rendered. This requires a separate server-side OAuth integration, a GitHub OAuth application/client ID and server-only client secret, a registered callback URL, state verification and an explicit account-linking design. Adding environment variables alone will not enable it.
- Existing email authentication is functional; email verification, reset-email delivery and automated recovery are not configured. The existing founder contact guidance remains.

## Guest boundary

The existing `/api/guest` router now supports production and non-loopback hosts. It retains hashed random tokens, an independent HttpOnly/SameSite=Strict cookie scoped to `/api/guest`, 24-hour expiry, owner checks, same-origin validation, request validation and request/creation limits. Production cookies add `Secure`; production must use HTTPS and the correct `APP_ORIGIN`. No schema migration or new dependencies are required.

Guests can answer guided discovery, converse, confirm evidence, prepare/view assessments, inspect recommendations/canvas and download PDF reports using the existing services. Guest conversations continue to use the labelled local deterministic provider, seed-only reference retrieval, and synthetic preview provenance; enabling guest entry does not opt guests into paid remote AI or private case retrieval. Existing `/preview` URLs are retained for compatibility.

Guest/account ownership stays separate. There is no safe guest-to-account association mechanism in the current architecture, so sign-in does not transfer, merge or overwrite guest plans. Guest cookies continue to grant access to guest URLs until expiry. Expired guest records are retained; automatic cleanup and recovery are not implemented. The 20 creations/IP/hour limiter uses process-local storage, as before; multi-instance deployments need shared rate-limit storage and deployment-specific proxy configuration.

## Changed files

- Added `frontend/src/components/EntryButton/EntryButton.css` and `frontend/src/services/useDiscoveryEntry.ts`.
- Updated `frontend/src/pages/Intro/Intro.tsx` and `Intro.css` for entry links, shared styling and guest entry, preserving the user's concurrent Scene 3 refinements.
- Updated `frontend/src/pages/Auth/Auth.tsx` and `Auth.css` for pill actions, introduction return, guest entry and registration-policy guidance.
- Updated `frontend/src/pages/SessionPage/SessionPage.tsx` to label the experience “Guest discovery”.
- Updated `backend/src/guest.ts` for production guest access, Secure production cookies and guest-facing naming.
- Updated `backend/tests/integration.test.ts` for production/non-loopback access, cookie properties, ownership, account privilege rejection and origin checks; its existing guest journey covers discovery, conversation, assessment, references and PDF export.
- Updated README, API reference, design system, local setup, architecture and this iteration record.

## Verification

- `npm run build`: shared, backend and frontend production builds passed.
- `DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration`: all 133 tests in six files passed. This includes real email/password login and invited registration, guest discovery/conversation/assessment/PDF, owner isolation, production Secure cookies and origin rejection. Tests ran only against the isolated `_test` database.
- Plain `npm test` currently fails because the user's pre-existing frontend refactor moved `frontend/src/drafts.ts` to `frontend/src/utils/drafts.ts`, while `backend/tests/contextual.test.ts` and `memory.test.ts` still import the former path. No unrelated refactor/test files were changed. Running the same six unit suites with a temporary `/tmp/kailor-entry-vitest.config.mjs` alias from the old import to the moved file passed all 274 tests.
- Prettier checks and `git diff --check` passed. No lint script is configured.
- Actual browser checks covered three introduction scenes, forward scrolling and keyboard navigation, dedicated sign-in/registration links, guest entry from introduction and registration, and real persisted guest discovery loading without sign-in. Existing backend integration coverage verifies results and report downloads.
- Responsive checks used desktop 1440×900, tablet 768×1024, mobile 375×667 and narrow mobile 320×568. Controls remained single and pill-shaped; mobile hit areas measured 44px, authentication had no horizontal overflow, and account links stayed in their persistent navigation. The latest 12px/8px gaps were confirmed in computed styles.
- Keyboard focus produced the expected visible 2px outline. Real pointer hover on Create account produced white background, lighter charcoal and a 2px lift; the discovery arrow and button showed independent transforms. Reduced-motion and touch hover exclusions were checked in the scoped CSS.
- GitHub entry cannot be exercised because the existing backend has no OAuth integration; its missing infrastructure is documented above.

Existing user edits, including the ongoing frontend refactor and concurrent Scene 3 changes, were preserved. Generated tracked QA snapshots from tests were restored to their prior contents. No staging, commit or push was performed.
