# kailor

An adaptive, AI-assisted technology discovery and solution-design platform. Iteration 001 is a working private consultant tool: persistent guided discovery, conversation, evidence-based recommendations, a solution canvas, immutable analysis reports and PDF export.

## Start locally

Node 22.12+ and running Docker Compose are required. From this directory:

```bash
npm ci
node scripts/setup.mjs
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://127.0.0.1:5173**. Sign in with `founder@kailor.local` and the random `ADMIN_PASSWORD` saved in the ignored root `.env`. Setup never overwrites an existing `.env`. API: `http://127.0.0.1:5050/api/health`. Keep `APP_ORIGIN` aligned with the exact frontend URL.

The current workspace already has a generated local `.env`, migrated PostgreSQL, reference seeds and five saved synthetic assessments. No provider credentials are needed. Cloudflare is opt-in and disabled by default; mock replies visibly identify development behaviour.

```bash
npm run simulate        # five reusable synthetic personas; persisted, pending review
npm test                # deterministic unit and provider-contract suite
npm run typecheck
npm run build
```

For the separate PostgreSQL integration database and test command, see [local setup](docs/deployment/LOCAL_SETUP.md).

## Structure

```text
backend/
  prisma.config.ts
  prisma/schema.prisma, seed.ts, migrations/
  src/ app.ts, index.ts, config.ts, db.ts, errors.ts, auth.ts
       discovery.ts, session-service.ts, assessment.ts, library.ts, ai.ts, pdf.ts
  tests/ unit.test.ts, integration.test.ts
frontend/
  src/ main.tsx, App.tsx, Intro.tsx, Workspace.tsx, SessionPage.tsx
       Discovery.tsx, Conversation.tsx, Canvas.tsx, Analysis.tsx
       Mascot.tsx, api.ts, types.ts, ui.tsx, styles.css
shared/src/index.ts
data/
  services.ts
  scenarios/     # 15 editable reference patterns
  personas/      # 5 clearly synthetic fixtures
scripts/         # setup, simulator, sample PDF, formatting helpers
compose.yaml
.env.example
package.json, package-lock.json, tsconfig.json
docs/
```

## Engineering documentation

- [Product vision](docs/product/PRODUCT_VISION.md)
- [Architecture](docs/architecture/ARCHITECTURE.md) and [data model](docs/architecture/DATA_MODEL.md)
- [Architectural decisions](docs/decisions/001-modular-monolith.md)
- [Discovery engine](docs/discovery/DISCOVERY_ENGINE.md)
- [Intelligence and budget controls](docs/intelligence/INTELLIGENCE_DESIGN.md)
- [Case intelligence and simulation](docs/case-library/CASE_INTELLIGENCE.md)
- [Complete API reference](docs/api/API_REFERENCE.md)
- [Design system](docs/frontend/DESIGN_SYSTEM.md)
- [Testing strategy](docs/testing/TESTING_STRATEGY.md)
- [Setup and deployment boundaries](docs/deployment/LOCAL_SETUP.md)
- [Iteration 001 results and remaining work](docs/iterations/001-initial-build.md)

## Boundaries

This is a local private initial build, not a public deployment. Estimates require consultant inputs; no market prices are invented. Synthetic assessments are never client success stories. The kai persona produces a proposal only. Live Cloudflare inference, monetary budgets, external-user auth, public hosting, final mascot assets and a fully art-directed PDF remain future work. No Git writes are performed by the application or setup scripts.
