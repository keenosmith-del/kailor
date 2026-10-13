# Iteration 002 — immersive experience

Date: 2026-10-13. Continued the existing repository and application services. All changes are uncommitted; no Git history or index writes were executed.

## Result and journey

The root opens three full-viewport vertical scenes with natural forward/reverse scrolling. The first alone has the exact stylized brand and supplied head. The next two are typography-led. Account controls are visibly coming soon; discovery entry creates a secure local guest preview rather than entering founder authentication.

Guided discovery uses the supplied body poses beside lower-right content on desktop and above content on mobile. Single choices persist and then advance; text/multiple choices submit explicitly. Existing answers can be revisited; recoverable failures preserve entered responses. Conversation, canvas and report remain views of the same backend session.

Completion is intentional: prepare the assessment, remain in discovery, then choose Explore the analysis. Later mutations invalidate readiness. Start again creates a new session and leaves earlier answers, conversation and snapshots intact. The private founder workspace remains separately authenticated at `/workspace`.

## Changed files

Frontend: `App.tsx`, `Intro.tsx`, `Mascot.tsx`, new `mascot-assets.ts`, `Discovery.tsx`, `Conversation.tsx`, `SessionPage.tsx`, `Canvas.tsx`, `Analysis.tsx`, `Workspace.tsx`, `api.ts`, `types.ts`, `styles.css`.

Backend: new `guest.ts`, `app.ts`, `auth.ts`, `session-service.ts`, `prisma/schema.prisma`, new migration `202610130003_guest_preview/migration.sql`, and `tests/integration.test.ts`.

Documentation: this log, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `DISCOVERY_ENGINE.md`, `API_REFERENCE.md`, root README. Existing discovery rules, scenario/persona files, recommendation logic, Cloudflare adapter and PDF generator are retained.

## Composition and motion

Warm cream tokens replace the older grey surfaces. Interactive controls alone use restrained glass/blur and light edges. No decorative dividers, uppercase kickers, numbered section decoration, dark panels, grey cards, invented artwork or ArrowUpRight appear. Header/footer chrome is removed from introduction; session navigation is contextual and minimal.

Scene components use Motion `useScroll`/`useTransform` with viewport-relative progress, small translation and opacity interpolation. Head and support text move at different rates. There is no scroll hijacking, infinite pulse, forced snapping or artificial loading pause. Reverse scroll uses the same interpolation. Reduced motion renders intro scenes directly and uses zero-duration mascot/discovery/report changes.

Only supplied neutral head, neutral body, confused and pensive static PNGs are mapped. Several states intentionally share a supplied pose. Other expressions remain available for future curation. Missing assets reserve clean space with no placeholder text or invented character. Original source assets were not altered.

## Security boundary

Guest owners have `AdminUser.isGuest=true`, disabled password login, their own hashed token and an HttpOnly/SameSite=Strict cookie scoped to `/api/guest`. Founder authentication rejects guest principals even if a guest token is copied into the founder cookie. Guest routes never use founder credentials as authority and restrict session operations to the owning guest.

The guest router is unavailable in production mode or with a configured non-loopback API host. It exposes no case approval, simulation, persona listing, private session listing or admin endpoints. Retrieval uses seeded references only, excluding reviewed private cases. Guest chat always forces labelled mock behaviour and cannot spend remote AI allowances. A 24-hour expiry and request/creation limits apply. Origin validation remains mandatory.

Records persist after cookie expiry; cleanup/retention and public recovery are deferred. This is a local development preview, not public authentication or a deployable customer-access architecture. Restart never deletes records. Existing private services and security controls remain covered by regression tests.

## Verification executed

- `npm run typecheck`: passed across all workspaces.
- `npm run build`: passed shared/backend/frontend production builds.
- `npm test`: 37 unit/provider/domain tests passed.
- Isolated PostgreSQL `npm run test:integration`: 18 tests passed, including all previous scenarios and a guest journey covering ownership, privilege rejection, seed-only knowledge, mock chat, reports/PDF, restart history and production disablement.
- Prisma generation passed and the third migration applied to both development and test databases.
- Actual browser introduction inspection at 1440×900, 1280×800, 768×1024, 390×844 and 360×800; scenes two/three additionally captured at laptop/tablet/small-mobile widths. Forward and reverse native scrolling inspected. Mascot and branding only appear in scene one.
- Guided discovery screenshots inspected at all five widths. DOM width checks showed no horizontal overflow. Desktop and small-mobile conversation inspected. Reports inspected at desktop/tablet/mobile widths; canvas inspected on desktop.
- A real guest journey persisted radio, checkbox and text answers, skipped optional fields, prepared an assessment while remaining on discovery, entered chat with preserved context, regenerated readiness after the chat revision, and opened the report explicitly.
- PDF download clicked successfully in the browser; report downloaded as `kailor-analysis-draft.pdf`. The existing PDF endpoint is also covered by the database test.
- Browser restart produced a different session ID. Database regression verifies the previous session remains retrievable.

Screenshots are internal verification artifacts under `.cache/qa/iteration-002`, excluded from Git. The downloaded synthetic report is a QA artifact, not a commercial result.

## Limitations

Physical phones/tablets, mobile keyboards, real touch swipes, OS reduced-motion emulation, screen readers and frame-rate profiling were not tested. Layout resizing and native browser scrolling do not establish physical-device performance. Reduced-motion behaviour is implemented in code but that preference was not emulated during browser inspection.

PNG source assets are approximately 1.7–2.2 MB each; responsive WebP delivery/optimization is a later performance task. Poses have not been synthesized or relabelled as new artwork. Some states share the neutral pose.

Guest preview is deliberately keyless; founder sessions retain the configured provider. There is no public sign-in/account creation, guest retention cleanup or customer identity recovery. Unsubmitted text still remains local to its view. Assessment snapshots are conservatively stale after any session revision, including chat. Existing Latin-font PDF limitations remain unchanged.

For local review: start Docker, run `npm run db:generate`, `npm run db:migrate`, then `npm run dev`; open `http://127.0.0.1:5173`. Founder access stays at `/workspace`. No deployment was performed.

## Correction pass — direct introduction and native snapping

This correction supersedes the earlier introduction copy/navigation described above. Backend, guest security, discovery definitions, report services and readiness behaviour are unchanged.

Files changed in this pass: `frontend/src/Intro.tsx`, `frontend/src/styles.css`, `frontend/index.html`, new `frontend/public/kailor-head.png`, this log and `docs/frontend/DESIGN_SYSTEM.md`.

Exact current copy:

- Scene 1 heading: **k ᐧ ai ᐧ lor**. Supporting text: “An interactive experience for discovering what you need to build, improve, automate, or launch.”
- Scene 2 heading: “Use guided discovery or conversation to explain what you’re doing, what you already have, and where you need help.” Supporting text: “kailor gathers context, identifies opportunities, and prepares a structured assessment.”
- Scene 3 heading: “Get analysis, recommendations, and practical next steps based on your situation.” Supporting text: “Explore ideas, websites, portfolios, automations, applications, integrations, and other possible solutions.” CTA: **Start discovery**.

All former introductory marketing copy and bottom-left filler were removed. Sign in/Create account are a single persistent top control group across all three scenes, honestly marked coming soon. Skip to discovery remains on scenes one/two. Only scene one has the stylized primary brand and mascot head.

A scoped native overflow container uses mandatory vertical CSS snapping and start-aligned viewport sections. Native smooth scroll and existing Motion fades observe that container. There is no wheel interception or forced JavaScript navigation. Compact-height viewports use proximity snapping with a minimum content height to keep content accessible; reduced motion uses immediate transitions. The scroll container is keyboard-focusable.

Title is exactly `kailor`. The requested `/kailor-head.png` favicon is an unchanged copy of the supplied neutral head in Vite's public directory. The served PNG, original PNG and built PNG were compared byte-for-byte successfully.

Verification: workspace typechecks and production builds passed; 37 unit tests and 18 real PostgreSQL integration tests passed. Actual browser inspection covered all three scenes at desktop 1440×900, tablet 768×1024 and mobile 390×844. Forward/reverse scrolling and final-scene persistent account controls were checked. Browser measurements confirmed a settled scroll offset of 900px for a 900px scene with `y mandatory` snapping. Browser title/favicon reference were verified, and Start discovery created a real guest session showing the existing initial question.

Remaining limits: no physical-device scroll testing, favicon legibility review at every OS/browser icon size, or runtime reduced-motion emulation. The source PNG favicon is relatively large; icon-size optimization can be addressed separately without redesigning artwork. No backend changes or Git writes were made in this correction pass.

## Follow-up: visible wheel animation and local-origin entry

CSS snapping alone did not provide a reliably visible animated wheel transition. Intro wheel gestures now request native smooth scrolling to the next/previous scene's measured offset, with a 700ms gesture lock to prevent trackpad momentum skipping scenes. Touch remains native CSS snapping; reduced-motion users bypass the wheel handler. The handler is scoped to intro, preserves zoom/horizontal gestures, and is removed on unmount. This deliberately supersedes the earlier no-wheel-interception implementation.

Local development origin validation accepts localhost, 127.0.0.1 and IPv6 loopback equivalents on the configured APP_ORIGIN port. Arbitrary hosts/ports remain rejected, and production continues to require the exact configured origin. Vite now has strictPort enabled to prevent silently selecting a different, disallowed port. An existing server occupied 5173, so verification reused it rather than stopping the user's process.

Verified actual entry from http://localhost:5173 into a new persisted guest discovery. Browser scroll sampling observed an intermediate offset during smooth movement rather than an immediate jump. Typechecks and frontend builds passed, as did 38 unit tests (including origin validation) and 18 PostgreSQL integration tests. Existing user-run development servers were left running.
