# Public frontend architecture

The public website uses `components/public/PublicLayout`, the shared navigation inventory, and the approved page compositions under `pages/Public`. Existing section IDs, motion, metadata and route indexing remain unchanged.

## Independent builds

- `npm run dev` keeps the existing full-stack application development environment.
- `npm run build` continues to build the application, backend and public site together for local application review.
- `npm run build:public` creates `frontend/dist-public` from `main.public.tsx` and `PublicWebsite.tsx`. Its build boundary rejects application runtime modules and copies only referenced public assets. Cloudflare Pages publishes this directory exclusively through native GitHub integration; see [deployment configuration](deployment/PUBLIC_WEBSITE_LAUNCH.md).
- `npm run preview:public` runs a static local review server without an API proxy.
- `npm run verify:public` checks prerendering, local asset references, approved statistics, production gates, metadata, links and the module boundary.

The public-only build substitutes a Careers email introduction for the private upload processor form. Account links lead to public availability pages, without authentication fields or API calls. Unknown and private routes return a real static 404. The full application routes, forms, backend, schemas and tests are retained independently.

## Active homepage

Hero, Marquee, Introduction, StackedPanels, Conversation, Collaboration, WhatWeveBuilt, ClientPerspectives (development only), Perspective and Activity remain in their approved composition. Shared reveals, capability modals, the conversation modal, sidebar and footer remain active.

SelectedWork, Consultants and the other abandoned public iterations were removed after checking application/website entries, static and dynamic imports, tests, styles and asset references. The retired hero video, old cloud video and media configuration were removed as well. `MediaSection` remains as a tested reusable helper; its type is colocated with it.

See [the cleanup report](deployment/PREDEPLOYMENT_CLEANUP.md) for exact removals, retained files, artifact sizes and verification.

## Public account pages

`AccountAccess` restores the original sign-in and create-account presentation using the existing `Auth.css`, with disabled fields and account actions, an availability notice and working Back/Contact/page-switch navigation. It renders no submission form and imports no authentication hook or API client. The public module boundary permits only the exact `src/pages/Auth/Auth.css` stylesheet; all authentication runtime modules remain excluded. The full application's `Auth.tsx` and authentication behaviour are unchanged. Both routes remain noindex.
