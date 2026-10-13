# Testing strategy

Run deterministic unit tests before database tests, then typecheck and production builds. Tests validate domain behaviour rather than duplicating UI markup.

`backend/tests/unit.test.ts` covers four entry branches, professional context, conditional pruning, option/type/skip validation, complete paths for five personas, scenario completeness, evidence-gated recommendations, missing-pricing behaviour, case source/review separation, mock proposal isolation, provider gating, session/daily call limits, invalid output, timeouts, 429/500 fallback, official REST payload shape, report evidence consistency, a real PDF signature and scrypt verification.

`backend/tests/integration.test.ts` uses Supertest and actual PostgreSQL/Prisma, not an in-memory database. It covers private auth, origin checks, cookie properties, persisted answers/evidence/history, stale and concurrent revisions, explicit chat confirmation, insufficient assessment evidence, immutable reports, separate live canvas, PDF HTTP output, all five synthetic runs, manual approval without source promotion, owner-scoped sessions and logout revocation.

The synthetic CLI runner is a separate product capability: it persists inspectable sessions and reports, compares expected/excluded services and records notes. Unit fixtures are shared with it. A passing synthetic regression means the implementation meets those assertions; it does not establish client satisfaction or commercial impact.

Browser inspection must include introduction, saved-session navigation, conversation, canvas, report panels, login and mobile-width layouts. Browser-only defects can survive typechecks; initial inspection caught and fixed duplicated React peer dependencies. PDF review renders all sample pages and checks margins, pagination, evidence and draft/synthetic labels.

Provider contract tests use fake HTTP responses. No live Cloudflare call, monetary billing enforcement, load test, penetration test, real-device gesture test or formal accessibility audit has been performed. Record actual execution results in the iteration log.
