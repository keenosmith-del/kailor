# Local setup

Requires Node 22.12+ (tested on Node 24.21.0), npm and Docker Compose with the Docker daemon running. Commands below run from the existing project root. No Git operations are required.

```bash
cd /Users/keenosmith/Programming/kailor
npm ci
node scripts/setup.mjs
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`setup.mjs` creates `.env` only if it does not exist, with a random admin password and file mode 0600. Read `ADMIN_PASSWORD` in that ignored file to sign in; the default email is `founder@kailor.local`. You can instead copy `.env.example` to `.env` and choose a password of at least twelve characters. Seed creates or updates the admin password hash. Do not put secrets in a `VITE_` variable.

Open **http://127.0.0.1:5173**. API is **http://127.0.0.1:5050/api/health**. Use the exact frontend origin in `APP_ORIGIN`; changing between `localhost` and `127.0.0.1` without updating configuration will correctly reject mutations. The Vite proxy makes browser calls same-origin.

The Compose database binds only to loopback and stores data in `kailor_kailor_postgres`. Development DB credentials are local conveniences, not production credentials. `docker compose down` stops it without deleting data. Do not use `down -v` unless you intend to destroy the local database.

```bash
npm run simulate            # persists fourteen clearly synthetic sessions and pending cases
npm test                    # deterministic/unit tests; no DB connection required
npm run typecheck
npm run build
```

Integration tests use a distinct database. Create it once:

```bash
docker compose exec -T postgres createdb -U kailor kailor_test
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run db:migrate
DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration
```

Do not repeat `createdb` if the test database exists. The suite refuses a database name not ending in `_test` and cleans up its own subjects, discoveries, cases and admin records. It retains idempotently seeded reference services and seed scenarios.

`npm run build` compiles backend ESM into `backend/dist` and static frontend assets into `frontend/dist`. `npm start -w backend` starts the compiled API from the backend workspace. Production frontend hosting is not provisioned: use a same-origin reverse proxy for `/api`, TLS, `NODE_ENV=production`, a strong private database URL and controlled admin access. Configure static SPA fallback to `index.html`. The backend does not automatically serve frontend assets.

Troubleshooting: start Docker if its socket is missing; check health and migration status if tables are absent; regenerate Prisma after schema changes; restart dev servers after dependency changes. Use `npm ci` to reproduce the lockfile. Security overrides for React deduplication, `deepmerge-ts` and `mysql2` are pinned in the root manifest and covered by build/database verification.

Iteration 003 adds nullable context/plan JSONB projections. Run `npm run db:generate` and `npm run db:migrate` before starting; no reset/reseed is needed for existing local data. `npm run evaluate` runs fourteen behavior fixtures without database access. See the iteration 003 record for isolated PostgreSQL verification.

## Iteration 004 schema update

Run npm run db:generate and npm run db:migrate against the configured database, then apply the same additive migration to the existing isolated kailor_test database before integration tests. Do not reset or reseed existing development data: seeding can update the founder password. Failed simulations now persist without an assessment. The existing local servers on API 5050/frontend 5173 can hot reload these changes; avoid launching duplicate servers. No deployment, credentials or billing setup is required for deterministic reliability tests.

## Iteration 005 schema and verification

Run `npm run db:generate` and `npm run db:migrate` before using knowledge-revision-aware servers. The additive migration preserves existing sessions/report content; do not reset or reseed existing data. Apply the same migration to `kailor_test` using the existing command above. `npm run evaluate:live` only checks/runs existing founder opt-in configuration and never enables paid billing; actual synthetic live evaluation requires the `_test` database and bounded limits. See [iteration 005](../iterations/005-contextual-intelligence.md) for exact commands and executed results.

## Iteration 007 upgrade

For an existing installation, run `npm run db:generate` and `npm run db:migrate`; no reset, reseed or founder-password change is needed. Apply the same additive migration to `kailor_test` with the existing isolated command. Open `/workspace` or `/plans` for private account plan management; direct `/plans/:planId` and old `/sessions/:sessionId/:view` URLs work. Guest discovery retains its independent guest cookie; iteration 009 enables it beyond local development.

The new default/example Cloudflare model is `@cf/meta/llama-3.1-8b-instruct-fp8`. An explicit `CLOUDFLARE_MODEL` in the ignored `.env` is not overwritten: inspect/choose a currently available model before opting in. The old model's official page currently reports it unavailable. Confirm account billing/free allocation independently; call allowances are not a zero-charge guarantee. The bounded live harness still skips without credentials and `AI_ALLOW_REMOTE=true`. See [ADR 013](../decisions/013-plan-aware-model-routing.md).

## Iteration 008 accounts

Set `REGISTRATION_POLICY=invite` (the default). Run `npm run db:generate` and `npm run db:migrate`; do not reset/reseed an existing database. The migration helper preserves only the existing account matching `ADMIN_EMAIL`, so verify that configuration first. All new registrations are members. Founder Workspace → Invite someone creates a seven-day, email-bound code for private sharing; no email delivery is configured. Use `/sign-in` or `/create-account`. For Cloudflare configuration, bounded live testing and recovery limitations, see [iteration 008](../iterations/008-ai-conversation-and-auth.md).

## Iteration 009 entry controls and guests

Start discovery now creates a guest discovery for visitors; both authentication pages offer Continue without an account. Existing registration policy remains in effect (`invite`, `closed`, or explicitly configured `public`). No new environment keys, database migration or dependencies are required. Production guest cookies are Secure: serve through HTTPS and set `APP_ORIGIN` to the exact public origin. No hosting or environment configuration was changed by this iteration.

GitHub OAuth is not implemented in the existing infrastructure. It needs server-side provider/callback handling, OAuth application credentials kept outside frontend code, and a reviewed account-linking policy; there is no frontend environment flag that enables it. Guest-to-account transfer, automated email recovery and guest retention cleanup remain unimplemented. See [iteration 009](../iterations/009-introduction-controls-and-guest-entry.md) for files and verification.
