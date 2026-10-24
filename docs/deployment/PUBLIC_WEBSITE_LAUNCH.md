# Cloudflare Pages public website

The public company website deploys independently from the application. This supersedes earlier Netlify preparation. The cleanup and controlled-launch reports remain historical records; their older hosting instructions do not configure this deployment.

## Remote configuration

- Account: `f81e057fd638ae3e93a1aa192f7a49dc`.
- Project: `kailor`, ID `2a9a84ba-65f7-4615-bf8b-374c861be510`.
- [Dashboard](https://dash.cloudflare.com/f81e057fd638ae3e93a1aa192f7a49dc/pages/view/kailor).
- Public address: <https://kailor.pages.dev>.
- Native GitHub source: `keenosmith-del/kailor`; production branch `main`.
- Repository root; build `npm run build:public`; output `frontend/dist-public`.
- Node major `22`, satisfying the repository's `>=22.12` requirement, through `.node-version` and `NODE_VERSION` in both environments.
- Production deployments enabled; previews enabled for all branches, with pull request comments enabled.
- Build watch includes: `frontend/*`, `shared/*`, `scripts/*`, `deploy/cloudflare/*`, `package.json`, `package-lock.json`, `tsconfig.json`, `.node-version`. Backend-only and documentation-only changes do not trigger website builds. The documentation-only push `949d71a` was verified as `is_skipped: true` through the Pages deployment API.
- Existing `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` configured for production and previews. These are browser-facing identifiers, not private credentials. Values intentionally omitted.

Project creation and configuration were verified through the Cloudflare API. The first native GitHub push deployment succeeded on 24 October 2026 at 00:03 UTC: deployment `69b0fcd5-ea16-4a7c-acb8-6fab917f327c`, source commit `f00e78a79cac7659ebe5f0e9a47a7f0284c2f4e4`, immutable address <https://69b0fcd5.kailor.pages.dev>. The provider build selected Node `22.23.4` and npm `10.9.9`. No Direct Upload project, Worker, Pages Function, backend, database or AI service is configured by this deployment.

## Build and routing boundary

The dedicated public entry point and strict module allowlist reject private application runtime imports. Only referenced public assets are copied. `frontend/dist` remains the separate full application build and is never published to Pages. Application development commands remain unchanged.

The build prerenders 11 public routes, preserves approved metadata and canonical URLs, and writes a top-level static `404.html`. Unknown URLs, private routes and `/api/*` receive HTTP 404 rather than an application shell. Sign-in and registration routes show the existing availability message. Careers uses email rather than backend submission.

`deploy/cloudflare/_redirects` preserves `/faqs` → `/questions`, `/timeline` → `/`, and `/pricing` → `/`, including trailing slash variants, with 301 responses. Pages may normalize prerendered directory URLs to trailing slashes; canonical metadata retains the approved domain and paths.

`deploy/cloudflare/_headers` sets nosniff, frame denial, referrer policy, restricted device permissions and HSTS. Only fingerprinted `/assets/*` receive immutable one-year caching. Pages addresses and preview builds receive HTTP noindex directives to avoid indexing duplicate sites before domain activation. Approved HTML metadata is unchanged.

## Domain and mail preservation

The production domain is **not attached or activated**. No registrar, nameserver, existing DNS, ownership or email settings have been changed. The owner added a pending Cloudflare zone during setup; assigned nameservers are `gemma.ns.cloudflare.com` and `sevki.ns.cloudflare.com`. Wrangler OAuth has `zone:read`, which cannot list/edit DNS records. The signed-in dashboard verified all nine imported records against the known public inventory, including all Zoho records; no DNS record edits were needed. A path/query-preserving www-to-apex 301 redirect is saved as a disabled draft, and Always Use HTTPS is enabled for the pending zone. Universal SSL is enabled but no certificate is issued yet. The owner explicitly approved TLS 1.2 minimum and Full (strict), which are now configured. DNSSEC remains disabled until the separate registrar signing/delegation flow is approved. A complete DNS-provider export is required before cutover because public queries cannot enumerate all unrelated records.

See [the observed DNS inventory and cutover plan](CLOUDFLARE_DNS.md). Do not migrate nameservers before reconciling the complete zone and obtaining explicit owner approval.

## Verification and workflow

Local verification: frontend TypeScript check, public build, 132 frontend tests, 11 prerendered routes, 260 asset references, metadata, public source boundary, basic credential patterns, and Cloudflare's local Pages routing/header parser. Unknown, private and API URLs return 404; retired paths redirect correctly. Remote verification on the Pages address: all 11 approved routes returned 200 after directory normalization; all 58 unique assets discovered from HTML and the public manifest returned 200; metadata, canonical URLs, sitemap, robots, noindex Pages-host headers, security headers, immutable asset caching and approved 301 redirects passed. `/workspace`, `/admin`, `/discovery`, `/api/health`, an unknown path and `/src/App.tsx` returned 404. The deployed module manifest passed the private-runtime exclusion checks.

Browser checks confirmed the mascot, marquee and scroll rendering, sidebar opening/collapse/Escape focus restoration, disabled insider link, contact form rendering and empty-form validation. No browser warnings/errors were recorded during these checks. No real enquiry sent; delivery and EmailJS origin restrictions remain unverified without an authorised live send. Frontend tests cover missing configuration and failed delivery fallback. Browser visuals were checked at 1280px and the panel's later 543px viewport. At 543px the page had no horizontal overflow, all four metric values fit, and the marquee animation was running. Arbitrary phone-size emulation and a full device matrix were unavailable; the responsive layout source is unchanged.

Reviewed public changes pushed to `main` deploy automatically. Use a branch/pull request for preview review before merging. Develop the application separately; extending the public module allowlist requires deliberate review. `kailor insider` remains disabled.

Rollback: select a previous successful production deployment in Pages and use **Rollback to this deployment**. For the first release there is no earlier Pages version: disable automatic production deployments if necessary, correct/revert the scoped source commit, and deploy the corrected Git revision. Future domain cutover must retain the current DNS export and old hosting until verified; nameserver rollback is a separate owner-approved change subject to propagation.
