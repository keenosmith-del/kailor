# Controlled public launch readiness — 22 October 2026

**Owner-requested follow-up:** The cloud panel’s “Built for…” MP4 has been restored to its pre-iteration native autoplay/loop and loaded-data readiness behavior. The added viewport/document playback controller was removed, and its visual entrance is again one-time. Reduced motion retains the original video element with autoplay disabled. Earlier video lifecycle verification below records the preceding implementation and no longer describes the restored playback policy. The MP4 asset and its CSS presentation were never changed. Frontend tests were updated to cover the restored behavior.

Implemented locally in the existing repository. **Not deployed. Not approved for live release.** The site is prepared for a controlled public launch subject to the infrastructure and owner decisions below. No development database reset, production seed, paid provider, analytics service, account provisioning or live deployment was performed.

## Completed scope and publication map

The established monochrome homepage, responsive composition and oversized footer wordmark are retained. Homepage composition: Hero → Marquee → Introduction → four sticky service panels → Conversation → Collaboration → Client Perspectives (development only) → Perspective → Activity. Selected Work and Consultants remain in source and do not render. Decorative heading dots are removed. Hero request text is now still rather than perpetually drifting; the approved first three positions remain visible.

| Route                                                         | Published experience                                                                 | Indexing                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------- |
| `/`                                                           | Approved launch homepage, unverified testimonials excluded                           | Index, sitemap                     |
| `/how-it-works`                                               | Heading + reusable Back                                                              | Noindex                            |
| `/timeline`                                                   | Heading + reusable Back                                                              | Noindex                            |
| `/pricing`                                                    | Heading + reusable Back                                                              | Noindex                            |
| `/careers`                                                    | Heading + reusable Back                                                              | Noindex                            |
| `/contact`                                                    | Heading + Back + shared conversation action + official email                         | Noindex                            |
| `/privacy`, `/terms`, `/cookies`                              | Fact-based initial policy pages + Back                                               | Noindex pending owner/legal review |
| `/sign-in`, `/create-account`                                 | Shared monochrome authentication form, Back and switch links                         | Noindex                            |
| `/app/*`, `/plans/*`, `/sessions/*`, `/workspace`, `/founder` | Existing protected application, founder role checks remain                           | Noindex                            |
| `/preview/*`                                                  | Development-only UI; production redirects to Sign in; guest APIs disabled by default | Noindex                            |
| `/services`, `/about`, `/work`                                | Implementations retained; excluded from launch routing; SPA returns Home             | Noindex static fallback            |

All public pages have their own folder and matching TSX/CSS. Substantial unfinished HowItWorks/Pricing/Contact child components are retained in their existing folders; previous compositions are recorded in `docs/archive/public-assets/README.md`. No backend/application architecture migration was required.

Pages sidebar, exactly in order: **Home** `/`; **How it works** `/how-it-works`; **Our Work** disabled span; **Our Team** disabled span; **Timeline** `/timeline`; **Pricing** `/pricing`; **Careers** `/careers`; **Contact** `/contact`. Disabled entries have no link, click handler or tab stop. The Coming later group is removed. Homepage section links come from the same inventory as the footer and exclude retired sections and production-gated feedback. The section heading is a button with `aria-expanded`, an animated down/side chevron and an inert collapsed list. Selecting a destination closes the sidebar. Bottom actions are a full-width white Create account with profile icon, then white Sign in beside charcoal Start conversation. The conversation action closes the sidebar and uses the existing provider/modal. Escape, focus restoration and outside dismissal remain.

`PageBack` only uses a previous route observed inside the mounted router; direct entry falls back to `/`. It never follows an external browser history entry. Switching auth forms uses the same Auth component/hook, with a modest content transition and cleared passwords/errors. Safe `returnTo`, accessible field labels, visible errors, password visibility and an immediate pending-request guard remain.

## Registration and account boundaries

- `REGISTRATION_POLICY=closed` is the source/default example: direct registration is refused before password hashing or database work. Existing approved accounts can sign in.
- `invite` requires a code. Server transaction consumes a matching email-bound hash only if unused and unexpired, and creates a member atomically. Duplicate/expired/wrong-email codes fail. Failed account creation rolls back redemption. Existing founder invitation issuance is unchanged; manual delivery remains necessary.
- `public` permits self-registration only when deliberately configured. Explicitly supplied codes are still validated. No client-supplied administrator role is accepted.
- `/api/auth/policy` reports the actual three-state policy and guest availability. The frontend starts closed, fails closed if the policy request fails, and explains testing restrictions. Invite mode presents a code field. No unavailable OAuth button is advertised.
- `GUEST_ACCESS` can be `enabled` or `disabled`; unset preserves local development access and disables all guest API routes in production, including journey creation and existing guest sessions. Production preview routes redirect to Sign in; local preview development is preserved. Preview URLs cannot bypass the API gate. This gate is independent of registration policy.
- `AI_ALLOW_REMOTE=false`, `AI_ALLOW_GUEST_REMOTE=false` remain the controlled-launch settings. No remote provider was enabled.
- Account cookies: HttpOnly, SameSite=Strict, `/api`, eight-hour expiry, Secure under production. Guest cookie: separate HttpOnly/SameSite=Strict `/api/guest` browser-session cookie with a 24-hour server lifetime. Expired guest cleanup already runs at startup and every 15 minutes, 50 guests per batch; monitor failures/backlogs.
- Production startup now requires an explicitly supplied database URL and HTTPS application origin. Loopback reverse-proxy trust requires explicit `TRUST_PROXY=loopback`; no broad forwarded-header trust is introduced.

No schema change is needed. No approved users were seeded or passwords changed. The ignored local `.env` was not read or rewritten; its explicit old policy can override the new defaults. Production must use a fresh, reviewed environment, **not copy the local `.env`**.

## Motion and media

SectionReveal is a single reversible scroll opacity/upward-drift layer without a one-time entry latch. It no longer wraps sticky service panels. Active Marquee, Introduction counters, Collaboration, Perspective, Activity, Client Perspectives and panel child reveals re-enter. Timed panel/conversation/feedback visuals pause offscreen and when the document is hidden, with cleanup on unmount. Counters have a meaningful static initial value. Continuous text drift in the hero has been removed. Marquee retains its approved logo track and reduced-motion static presentation.

Cloud video retains the local `/videos/kailor-built-for-loop.mp4`, charcoal layout, sticky stack, muted inline looping and readable underlying word fallback. Playback depends on viewport and document visibility. `canplay`/`loadeddata` retry playback; `emptied`/error clear readiness; rejected autoplay leaves the fallback. Async readiness is guarded after cleanup, subscriptions and timers are removed, and returning to the route creates fresh video state. Reduced motion renders a static word presentation without a video element. A no-JavaScript stylesheet override keeps prerendered content visible.

Browser verification used installed Chrome headlessly at 1440px, 768px, 390px and 320px. Navigation, initial/cross-route hashes, sidebar collapse, shared modal opening, cookie saving/Escape/focus restoration, auth switching and password visibility were exercised. No document horizontal overflow or sidebar row clipping was found. All six active content sections were revisited in both scroll directions and remained visible; the MP4 wrapped from its end back to the beginning while playing. Production preview entry redirected to Sign in. Actual MP4 playback reached readyState 4, resumed after sign-in navigation/back, and paused when scrolled away. Reduced motion omitted the video. JavaScript-disabled homepage content and styling were inspected. This is local Chrome verification; Safari/iOS, staging TLS and real email delivery remain unverified.

## Testimonials, images and static assets

Canonical component: `Home/ClientPerspectives/ClientPerspectives.tsx` + CSS. The old ClientFeedback and Testimonials implementations/styles are removed. Ten explicitly synthetic local messages rotate about every five seconds while visible, with overlapping content crossfade inside the same compact charcoal card, roles, date metadata, avatars/initials and Get started to Create account. Production builds hard-gate this component and its navigation link; there is no environment switch to accidentally publish synthetic endorsements.

Before publishing feedback, replace messages, attribution, dates and images with authentic permissioned content and review the gate deliberately. No synthetic feedback is structured as reviews/ratings. Portrait allocation and asset provenance are in `docs/style/ASSET_ALLOCATION.md`. Hero reserves 1–10 (first three currently visible), Introduction 11–16, retired Selected Work 17–20, local feedback 21–24 then initials. No active client portrait repeats. Consent/usage rights for pre-existing images and logos require owner confirmation.

Azure now uses a local original vector; it was the only missing technology logo reference. Cookie cutter is an original local SVG. Other technology entries reuse existing SVGs, without remote image dependencies. Public-folder source/CSS/ZIP files were moved into `docs/archive/public-assets`, preserving future work while preventing deployment. Build cleanup removes `.DS_Store` and documentation files from output. Existing unused media remains in source/build, including the old 58 MB hero video; it is not requested by the launch homepage. Further asset pruning/compression can reduce artifact size without changing the approved design.

## Cookies, policy drafts and email

A native modal dialog in `CookiePreferences/` handles top-layer focus containment, Escape, backdrop dismissal and restoration to the Cookies trigger. Footer control has the cookie icon on the left at the bottom right. A versioned `kailor.cookie-preferences.v1` localStorage record stores essential=true, optional=false and update time; unavailable browser storage is handled with a visible message. Users can continue navigation without saving. Existing essential session cookies are unaffected. There are no fictional analytics/marketing toggles, optional trackers or implied certification of legal compliance.

Privacy/Terms/Cookie pages describe actual enquiry, account, session, project, guest and optional inference flows. Existing project preferences/drafts also use browser storage. Enquiries use the existing EmailJS implementation only when its public service/template/key configuration is present. Missing delivery configuration produces a user-safe failure and points to **keenosmith@kailor.co.za**. Contact remains usable through `mailto:`. No email was sent during verification. Confirm EmailJS recipient/template, allowed origins, abuse controls, data location and provider terms before enabling production delivery.

Policy drafts explicitly identify review requirements: contracting entity, responsible party/Information Officer, lawful grounds, retention (including logs/backups/enquiries/accounts), providers and international transfers, consumer terms, rights handling and incident procedure. No physical address, registration number or certification was invented. Rights-request/complaint wording was checked against the Information Regulator's official information: https://inforegulator.org.za/complaints/ and https://inforegulator.org.za/popia-forms/ . These are initial drafts, not a legal opinion.

## SEO and crawler behaviour

One route metadata inventory supplies client titles/descriptions/canonical/social metadata and build-time HTML. Build prerenders the actual content of all nine public routes plus both auth routes into separate route `index.html` files, including stylesheets, unique titles, robots, canonical URLs, OG/Twitter fields and a 1200×630 raster sharing card. The homepage contains organisation JSON-LD with verified name, URL, email and founding year **2025**; no ratings, counts or awards were invented. Favicon remains local. Public and application footer copyright uses 2025–current year.

Only Home is approved for indexing. Shells, drafts and auth are noindex. Sitemap contains Home only. `robots.txt` permits crawlers to read noindex HTML and blocks API crawling. Private/unknown route fallback `spa.html` has noindex and no inherited homepage canonical/social tags. Client navigation replaces all route metadata, including public-to-auth/private transitions. Nginx adds matching HTTP robots headers independently of JavaScript. This is static prerendering, not a continuously rendered server; rebuild after publication changes. An incorrectly configured host that serves root `index.html` for every URL will defeat per-route metadata: install/test the supplied route-aware fallback. Robots directives are not access controls.

`verify-launch.mjs` checks prerendered content, index policy, internal destinations, 329 static asset references, no unpublished testimonial composition, no source archives in technology assets and common private credential patterns. This is a bounded scan, not proof against all possible secret formats; review the final configured artifact and never place private values in `VITE_` variables.

A final integration rerun exposed an existing intermittent privacy-scan false positive: numeric UUID tails in generated `evidenceIds`/`caseIds` arrays could be interpreted as phone numbers. The existing system-reference exemption now covers only exact UUIDs in those two typed reference arrays; arbitrary user text/arrays and non-UUID values remain scanned. Deterministic regression assertions cover each case. No remote provider was enabled or called.

## Verification performed

- `npm run typecheck` — passed for all workspaces.
- `npm run build` — passed backend/shared/frontend; 11 routes prerendered, no production testimonial leakage.
- `npm test` — backend 339 tests; frontend 59 tests (including newly added auth and video lifecycle cases). All passed in the final run recorded below.
- `DATABASE_URL=postgresql://kailor:kailor_local@127.0.0.1:5432/kailor_test REGISTRATION_POLICY=invite GUEST_ACCESS=enabled npm run test:integration` — 12 files, **166 tests passed**. `_test` database existence was checked before execution. No development or production database was used. Existing test schema was already migrated; no migration/reset/seed was run.
- `node scripts/verify-launch.mjs` — 11 route and 329 static-reference checks passed.
- Local headless Chrome checks described above — no page errors. Authentication policy/account requests were intercepted for browser UX tests; real server sign-in/registration policies and invitation concurrency were exercised in integration tests with synthetic records.

Unit API tests require local socket access for Supertest. The managed sandbox initially refused listeners; rerun with local-network execution permission passed. The prerender builder disables Vite HMR sockets, so the normal build does not require a listening dev server. No real authenticated production browser, external delivery, mobile-device, deployed CSP or full security audit is claimed.

## Remaining deployment blockers and decisions

1. Hosting provider, server/region, persistent isolated PostgreSQL, DNS ownership and TLS certificate setup have not been supplied or provisioned. Choose them and verify costs/backups/restore. No database credentials exist in the production example.
2. Supply production secrets through a secret manager or restricted host environment. Decide how approved testing accounts will be provisioned; **do not run db:seed against production**. Existing founder sign-in requires the correct isolated production account, not a local seed.
3. Approve legal/policy drafts and pre-existing image/logo rights; replace unverified testimonials before removing the hard gate. Blank pages remain intentionally noindex.
4. Approve/configure email delivery or accept the direct email contact path as the launch channel. No new external service was enabled.
5. Validate staging HTTPS, same-origin proxying, cookies, exact Origin rejection, per-client rate limits, founder/member/guest isolation, CSP and missing-asset 404s. Nginx configuration is provided as a reviewable example, not syntax-tested on an installed Nginx host. Its CSP permits inline styles required by Motion, same-origin scripts/media and the existing EmailJS endpoint. Test actual host headers and external provider requirements before release.
6. In-memory rate limits reset on restart and are per API instance. Single-instance controlled launch can use them; multiple instances need reviewed shared/edge limits. Configure `TRUST_PROXY=loopback` only with the supplied local proxy topology; do not use it for an unrelated remote proxy without review.
7. Review runtime package advisories, asset budget and accessibility on real target devices. The lockfile is retained; no dependency upgrade or remote paid AI configuration was performed.
8. **Explicit owner approval is required for live deployment.** No release approval is implied by passing local checks.

## Exact deployment procedure after provisioning

This repository targets one Linux Node API process behind Nginx with same-origin static hosting and PostgreSQL. An alternative host must implement the same routes/security semantics.

1. Install Node 24.21.0 from `.nvmrc` (the workspace minimum remains `>=22.12`), Nginx and the chosen database/client tooling. Create a restricted service account, versioned release directory `/srv/kailor/releases/<release-id>` and a separate persistent environment file outside the web root. Provision an isolated production database with least-privilege credentials and take a restorable backup before migrations. Obtain a TLS certificate covering apex and www.
2. Copy the reviewed repository revision into the release directory. Run `npm ci`, `npm run db:generate`, `npm run typecheck`, `npm test`, `npm run build`, then `node scripts/verify-launch.mjs`. Build needs dev dependencies. Supply approved EmailJS public identifiers at frontend build time only if delivery is approved. Never copy private secrets to `frontend/public` or `VITE_` settings.
3. Install real values from `deploy/production.env.example` into the private backend environment: explicit `NODE_ENV=production`, private `DATABASE_URL`, `APP_ORIGIN=https://kailor.co.za`, `HOST=127.0.0.1`, `PORT=5050`, `TRUST_PROXY=loopback`, `REGISTRATION_POLICY=closed`, `GUEST_ACCESS=disabled`, mock AI and both remote flags false. Supply an explicitly reviewed founder email for any later administrative workflow; do not include seed passwords.
4. Review pending migrations using `npx prisma migrate status --config backend/prisma.config.ts`. With the private production environment loaded, apply additive migrations only using `npx prisma migrate deploy --config backend/prisma.config.ts`. **Do not run db:seed, migrate reset, compose down -v or the root db:migrate helper**: the helper also adjusts an existing configured founder role. This iteration itself adds no migration. Restore service compatibility/rollback from the backup if any unrelated pending migration fails.
5. Configure the process supervisor to run `npm start -w backend` from the release directory with the private environment loaded and a non-root account. The compiled entry is `backend/dist/backend/src/index.js`. Configure restart policy, log rotation, disk limits, backups and monitoring of `GET /api/health` and guest cleanup failures. Health requires a real DB connection.
6. Adapt `deploy/nginx.conf.example` with real certificate and release paths, then run `nginx -t`. Point `/srv/kailor/current` at the reviewed release and reload Nginx. Publish **only frontend/dist**. Keep database, sources, archives, environment files and backend outside the document root. Hashed JS/CSS are immutable; HTML revalidates; API is no-store. `/api/*` must never use the SPA fallback. Missing assets must return 404. Unknown/private routes use `spa.html`, while real public directories use their prerendered `index.html`. Apex is canonical; redirect www/HTTP.
7. Run staging checks before public DNS: visit/refresh every listed route, fetch raw route HTML without JS, validate robots/sitemap/social image/favicon/CSP, inspect real Secure/HttpOnly/SameSite cookies, test login/logout, direct closed registration, guest denial, invitation scenarios in a separate staging policy if authorised, role/isolation/origin/rate limits and external email delivery if enabled. Confirm no development secrets or demo testimonials in the final artifact. Never run the integration suite against production.
8. Present staging results and the exact release/environment/access decisions for explicit owner approval. Only then update production DNS/release routing. Verify health, errors and rollback by repointing the `current` symlink to the previous compatible release; do not roll back database migrations destructively.

For local static review only: `node scripts/preview-launch.mjs` serves `frontend/dist` at `http://127.0.0.1:4173`, mirrors the route-aware fallback and proxies API to local 5050. It is not a production server.

## Local review artifacts

Development-only Client Perspectives rotation and desktop/mobile presentation were also browser-checked: one fixed card, content changed after about five seconds, no mobile overflow. Screenshots and command/browser logs are retained locally under `.cache/controlled-launch/` (ignored, not shipped): `desktop`, `mobile-menu`, `cloud`, `auth`, `cookies` and `nojs` PNGs. `browser-check.cjs` records the local browser procedure and uses the bundled Playwright package with installed Chrome; it is not a production dependency. Policy/account requests were stubbed for browser UI checks as described above.

## File change inventory

`M` modified; `D` removed from its old location; `A` added. ClientFeedback TSX/CSS moved into ClientPerspectives; public technology source/archive files moved into docs/archive/public-assets. Unfinished sections and application data are retained. Generated historical QA reports rewritten by integration tests were restored to their original contents.

```text
M	.env.example
M	backend/package.json
M	backend/src/app.ts
M	backend/src/auth.ts
M	backend/src/config.ts
M	backend/src/conversation-guidance.ts
M	backend/src/guest.ts
M	backend/tests/accounts.integration.test.ts
M	backend/tests/consulting.test.ts
M	backend/tests/public-registration.integration.test.ts
M	docs/deployment/LOCAL_SETUP.md
M	docs/deployment/PUBLIC_WEBSITE_LAUNCH.md
M	docs/style/PUBLIC_WEBSITE.md
M	docs/style/README.md
M	frontend/index.html
M	frontend/package.json
M	frontend/public/robots.txt
M	frontend/public/sitemap.xml
D	frontend/public/technology/SelectedWork.css
D	frontend/public/technology/SelectedWork.tsx
D	frontend/public/technology/kailor-selected-work-refresh.zip
M	frontend/src/App.tsx
M	frontend/src/components/Footer/Footer.tsx
M	frontend/src/components/public/ConversationModal/ConversationModal.tsx
M	frontend/src/components/public/ConversationVisual/ConversationVisual.tsx
M	frontend/src/components/public/Footer/Footer.css
M	frontend/src/components/public/Footer/Footer.tsx
M	frontend/src/components/public/Header/Header.css
M	frontend/src/components/public/Header/Header.tsx
M	frontend/src/components/public/PublicLayout/PublicLayout.css
M	frontend/src/components/public/PublicLayout/usePublicPage.ts
M	frontend/src/components/public/StackedPanels/StackedPanels.tsx
M	frontend/src/components/public/navigation.ts
M	frontend/src/pages/Auth/Auth.css
M	frontend/src/pages/Auth/Auth.tsx
M	frontend/src/pages/Auth/useAuthentication.ts
M	frontend/src/pages/Public/Contact/Contact.tsx
M	frontend/src/pages/Public/Home/Activity/Activity.tsx
D	frontend/src/pages/Public/Home/ClientFeedback/ClientFeedback.css
D	frontend/src/pages/Public/Home/ClientFeedback/ClientFeedback.tsx
M	frontend/src/pages/Public/Home/Collaboration/Collaboration.tsx
M	frontend/src/pages/Public/Home/Conversation/Conversation.tsx
M	frontend/src/pages/Public/Home/Hero/Hero.css
M	frontend/src/pages/Public/Home/Hero/Hero.tsx
M	frontend/src/pages/Public/Home/Home.tsx
M	frontend/src/pages/Public/Home/Introduction/Introduction.tsx
M	frontend/src/pages/Public/Home/Marquee/Marquee.tsx
M	frontend/src/pages/Public/Home/Perspective/Perspective.tsx
M	frontend/src/pages/Public/Home/SectionReveal/SectionReveal.tsx
D	frontend/src/pages/Public/Home/Testimonials/Testimonials.css
D	frontend/src/pages/Public/Home/Testimonials/Testimonials.tsx
M	frontend/src/pages/Public/HowItWorks/HowItWorks.tsx
M	frontend/src/pages/Public/Pricing/Pricing.tsx
M	frontend/tests/public.test.tsx
M	package.json
A	.nvmrc
A	backend/tests/registration-policy.test.ts
A	deploy/nginx.conf.example
A	deploy/production.env.example
A	docs/archive/public-assets/README.md
A	docs/archive/public-assets/SelectedWork.css
A	docs/archive/public-assets/SelectedWork.tsx
A	docs/archive/public-assets/kailor-selected-work-refresh.zip
A	docs/deployment/CONTROLLED_LAUNCH_READINESS.md
A	docs/style/ASSET_ALLOCATION.md
A	frontend/public/social/kailor.png
A	frontend/public/social/kailor.svg
A	frontend/public/svgs/cookie-cutter.svg
A	frontend/public/technology/azure.svg
A	frontend/src/components/public/CookiePreferences/CookiePreferences.css
A	frontend/src/components/public/CookiePreferences/CookiePreferences.tsx
A	frontend/src/components/public/PageBack/PageBack.css
A	frontend/src/components/public/PageBack/PageBack.tsx
A	frontend/src/components/public/PageShell/PageShell.css
A	frontend/src/components/public/PageShell/PageShell.tsx
A	frontend/src/components/public/PublicLayout/metadata.ts
A	frontend/src/components/public/PublicLayout/routes.json
A	frontend/src/components/public/useDocumentVisible.ts
A	frontend/src/pages/Public/Careers/Careers.css
A	frontend/src/pages/Public/Careers/Careers.tsx
A	frontend/src/pages/Public/Cookies/Cookies.css
A	frontend/src/pages/Public/Cookies/Cookies.tsx
A	frontend/src/pages/Public/Home/ClientPerspectives/ClientPerspectives.css
A	frontend/src/pages/Public/Home/ClientPerspectives/ClientPerspectives.tsx
A	frontend/src/pages/Public/Privacy/Privacy.css
A	frontend/src/pages/Public/Privacy/Privacy.tsx
A	frontend/src/pages/Public/Terms/Terms.css
A	frontend/src/pages/Public/Terms/Terms.tsx
A	frontend/src/pages/Public/Timeline/Timeline.css
A	frontend/src/pages/Public/Timeline/Timeline.tsx
A	frontend/src/prerender.tsx
A	frontend/tests/auth.test.tsx
A	frontend/tests/media-lifecycle.test.tsx
A	scripts/prerender-public.mjs
A	scripts/preview-launch.mjs
A	scripts/verify-launch.mjs
```
