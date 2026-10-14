# Testing strategy

Run deterministic unit tests before database tests, then typecheck and production builds. Tests validate domain behaviour rather than duplicating UI markup.

`backend/tests/unit.test.ts` covers four entry branches, professional context, conditional pruning, option/type/skip validation, complete paths for five personas, scenario completeness, evidence-gated recommendations, missing-pricing behaviour, case source/review separation, mock proposal isolation, provider gating, session/daily call limits, invalid output, timeouts, 429/500 fallback, official REST payload shape, report evidence consistency, a real PDF signature and scrypt verification.

`backend/tests/integration.test.ts` uses Supertest and actual PostgreSQL/Prisma, not an in-memory database. It covers private auth, origin checks, cookie properties, persisted answers/evidence/history, stale and concurrent revisions, explicit chat confirmation, insufficient assessment evidence, immutable reports, separate live canvas, PDF HTTP output, all fourteen synthetic runs, manual approval without source promotion, owner-scoped sessions and logout revocation.

The synthetic CLI runner is a separate product capability: it persists inspectable sessions and reports, compares expected/excluded services and records notes. Unit fixtures are shared with it. `npm run evaluate` separately reports expected/excluded services, grounded evidence and readiness for all fourteen personas. A passing synthetic regression means the implementation meets those assertions; it does not establish client satisfaction or commercial impact.

Browser inspection must include introduction, saved-session navigation, conversation, canvas, report panels, login and mobile-width layouts. Browser-only defects can survive typechecks; initial inspection caught and fixed duplicated React peer dependencies. PDF review renders all sample pages and checks margins, pagination, evidence and draft/synthetic labels.

Provider contract tests use fake HTTP responses. No live Cloudflare call, monetary billing enforcement, load test, penetration test, real-device gesture test or formal accessibility audit has been performed. Record actual execution results in the iteration log.

## Iteration 003 evaluations

`adaptive.test.ts` evaluates useful question order, indirect-answer avoidance, unknown fleet context, exact teacher application scope, preliminary/deeper readiness, explicit technology exclusions, existing-provider recognition, source-backed evidence, hypothetical input, URL evidence stages, cross-industry retrieval and universal provider validation. Existing catalogue tests remain for historical compatibility; production progression uses the adaptive planner.

PostgreSQL integration adds saved-plan replay at the current revision, natural grouped confirmation, dismissed-proposal suppression, immutable report retention after chat changes, custom synthetic definitions, human evaluation and approved-pattern reruns. The database must end in `_test`; generated owners/sessions/runs/cases are isolated and cleaned without resetting either database. The baseline had 40 unit assertions. See the iteration record for final actual counts, builds and observed browser/PDF limits.

Browser verification exercised the primary nail-technician guest flow, normal-language chat, grouped acceptance, explicit readiness/preparation/navigation and visible recommendation evidence. Snapshot PDF pages were rendered and inspected. Browser download-event capture timed out; API PDF responses and snapshot rendering passed. Live provider accuracy, full mobile/browser matrices and formal accessibility/security audits remain unverified.
