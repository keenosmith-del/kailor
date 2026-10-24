> **Personalised consulting update (16 October 2026):** See [iteration implementation, verification and limits](docs/iterations/016-personalised-consulting.md). Guest entry now offers Discovery and Coffee chat; Analysis and live Canvas share grounded consulting information. Apply the additive `202610160001_consulting_workspace` migration before running the new backend. Guest cookies now last for the browser session within the existing 24-hour server ceiling, with periodic expired-data cleanup.

> **Current refinement (15 October 2026):** See [implementation and deployment](docs/refinement/IMPLEMENTATION.md), [architecture audit](docs/refinement/AUDIT.md) and [executed verification](docs/refinement/TESTING.md). These supersede older iteration descriptions of the conversation dropdown, slide report, guest-only local routing and unsupported account transfer. Apply the additive ProjectSource migration before using the resource library. GitHub OAuth and binary PDF/Word ingestion remain unavailable; text/CSV extraction and explicit guest-project transfer are implemented.

# kailor

For interface changes, follow the [kailor visual style reference](docs/style/README.md), which captures the current typography, colours, pill buttons, hover behaviour, spacing and interaction preferences.

The current project workspace uses Chat as the signed-in entry, shared sidebar navigation, project/conversation history, Discovery, Canvas, Analysis and Sources. Guest entry offers Start discovery or Coffee chat within the same temporary project. The backend Plan model and existing intelligence remain. See [iteration 011: implementation, changed files, verification and limits](docs/iterations/011-project-workspace.md). The former founder dashboard is now at `/founder`; `/workspace` redirects to Chat.

Iteration 007 is a private, AI-assisted technology consultancy platform with independently owned business/project plans, persistent conversation memory, guided Discovery, confirmation-gated evidence, Solution Canvas, immutable assessments and PDF export. Plans can be created, renamed, resumed, archived, restored and explicitly compared without merging their knowledge.

Cloudflare inference follows the existing configuration, guest-access, privacy and usage-limit controls. Deterministic evaluation passes do not establish live model quality. See the [iteration 007 implementation and execution report](docs/iterations/007-conversational-memory-and-plans.md).

## Start an existing local installation

```bash
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Existing data needs the additive plans-and-memory migration; do not reset or reseed the database. Open `/app/chat` for the application or `/founder` for private founder tools. Existing session URLs still work.

## First installation

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

The current workspace already has a generated local `.env`, migrated PostgreSQL, reference seeds and saved synthetic assessments. No provider credentials are needed. Cloudflare is opt-in and disabled by default; mock replies visibly identify development behaviour.

```bash
npm run simulate        # fourteen synthetic evaluation personas; persisted, pending review
npm test                # deterministic unit and provider-contract suite
npm run typecheck
npm run evaluate
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
  personas/      # 14 clearly synthetic fixtures
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
- [Latest iteration 007 results and limitations](docs/iterations/007-conversational-memory-and-plans.md)

## Boundaries

This is a local private initial build, not a public deployment. Estimates require consultant inputs; no market prices are invented. Synthetic assessments are never client success stories. The kai persona produces a proposal only. Live Cloudflare inference, monetary budgets, external-user auth, public hosting, final mascot assets and a fully art-directed PDF remain future work. No Git writes are performed by the application or setup scripts.

## Iteration 002 experience

The root page now opens a three-scene scroll story using the supplied static mascot. Start discovering or Skip to discovery enters a persisted local guest preview without founder permissions. The private founder workspace remains at `/workspace`. Assessment preparation stays in discovery until the user chooses Explore the analysis; Start again creates a new session.

Run `npm run db:generate` and `npm run db:migrate` before starting an existing checkout; iteration 002 adds the guest-principal flag. Guest discovery now works in production as well as locally, using the existing isolated guest principal, seed references and local conversation guidance. Production guest cookies require HTTPS. See [introduction controls and guest entry](docs/iterations/009-introduction-controls-and-guest-entry.md) for current behaviour and authentication limitations; iteration 002 records the original local-only implementation.

## Iteration 003 — adaptive intelligence

Discovery now selects relevant questions using saved context and explainable priorities, and reports qualitative readiness without requiring form completion. Guided and conversational inputs share confirmed evidence, with grouped natural-language proposals, explicit correction/rejection and persistent plans. Approved case retrieval considers workflows, scope and constraints; custom synthetic persona/evaluation APIs support curated learning. Existing guest restrictions and immutable reports remain.

```sh
npm run db:generate
npm run db:migrate
npm test
npm run evaluate
npm run typecheck
npm run evaluate
npm run build
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
npm run dev
```

See [iteration 003](docs/iterations/003-adaptive-intelligence.md) for migration, exact verification results, changed files and limits. Local extraction is deliberately narrow. Live Cloudflare remains unverified because credentials are absent and opt-in is disabled. No billing, public deployment or model training was enabled.

## Iteration 004 reliability

Discovery now validates evidence quality, distinguishes skipped/unknown/not-applicable responses, confirms material corrections and offers recovery when useful information is exhausted. One independent evidence policy governs planner, assessment, chat and Canvas; industry or case matches alone cannot create a recommendation. Reports remain immutable qualified drafts. See [the implementation and verification report](docs/iterations/004-intelligence-reliability.md) for contracts, actual tests, migration, limits and local commands.

Iteration 005 adds contextual operational gaps, separate knowledge/report revisions, constrained model-assisted follow-up wording, short-lived cross-view drafts, founder pattern forms and audited case-supported approach comparisons. See [implementation, verification and limits](docs/iterations/005-contextual-intelligence.md) and [ADR 007](docs/decisions/007-contextual-knowledge-and-case-reasoning.md). Remote model quality is unverified when credentials/opt-in are absent.

## Iteration 008

Conversation now has a fixed sitting mascot, inline confirmations and a stationary shell with internal transcript scrolling. Shared controls are compact and opaque; glassmorphism is removed. Sign in and invited signup are functional, new accounts have member access, and founder tools require server-side admin authorization. Cloudflare's 70B fast JSON-mode model is configured and bounded live synthetic responses were verified. See [the implementation and validation report](docs/iterations/008-ai-conversation-and-auth.md), including setup, exact test results and remaining launch limitations. Run `npm run db:migrate` for the additive account/context migration; it preserves only the existing configured founder and does not reseed data.

## Authentication visual replication (iteration 010)

Sign in and Create account now use kai's split-screen authentication styling with kailor's unamused mascot. Registration stores a full name, validates password confirmation and creates member accounts without an invitation. Existing sign-in and guest discovery remain functional. Apply the additive account-name migration and regenerate Prisma; no reset/reseed is needed. GitHub OAuth is not implemented in kailor and its control is explicitly unavailable. See [implementation, configuration and verification](docs/iterations/010-kai-authentication-replication.md).

## Consulting intelligence (requested iteration 013)

Operational requirements now retain essential, optional and deferred priorities across reports, Canvas and Chat. Assessments compare suitable existing platform categories with manual improvements and custom engineering, propose a practical pilot and retain explicit decisions. See the [architecture, implementation and executed validation](docs/iterations/017-consulting-intelligence.md). The documentation sequence continues after 016; no migration is required for these backward-compatible report/Canvas fields.

## Solution canvas rebuild (iteration 018)

Canvas now presents visual solutions with centred details, editable requirements, persistent multi-selection, current reasoning PDFs and reviewed combined consultancy intake. Submitted requests persist as pending scope snapshots and are accessible to admins in `/founder`; selection never commissions work. Existing project records, Canvas consumers and historical assessments remain compatible. Apply the additive migration with `npm run db:generate` and `npm run db:migrate` without a reset/reseed. See [architecture, migration and executed validation](docs/iterations/018-solution-canvas-rebuild.md).

## Discovery intelligence and solution reconciliation (requested iteration 014)

Discovery now distinguishes online-presence requests from custom applications, respects exclusions and deferred features, asks relevant launch questions, and acknowledges saved assessments with the existing smiling mascot. Current solution refinements feed Analysis, Chat, reasoning exports and combined consultancy scope while historical reports remain immutable. See the [root-cause audit, behaviour, validation and limitations](docs/iterations/014-discovery-intelligence-and-solution-reconciliation.md). No additional migration is required beyond the existing iteration 018 migration.

## Public website build

`npm run build:public` creates the standalone company website in `frontend/dist-public`; `npm run preview:public` reviews it locally without the application backend. Cloudflare Pages publishes only that directory through native GitHub integration. See [the deployment report](docs/deployment/PUBLIC_WEBSITE_LAUNCH.md). The existing `npm run dev` and `npm run build` commands continue to support the full application separately.

See [the pre-deployment cleanup report](docs/deployment/PREDEPLOYMENT_CLEANUP.md) for asset removals, retained product features, verification and the current deployment boundary. Nothing is automatically committed, pushed or deployed by these build commands.
