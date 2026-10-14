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

## Iteration 004 reliability acceptance

`reliability.test.ts` adds conservative text quality, uncertainty, non-English/proper nouns, independent sufficiency, bounded exhaustion/recovery, negation, corrections, hypothetical/history clauses, preferences, tradeoffs, source grounding, provider schema/semantic rejection, local privacy routing and unsuitable reference coverage. `data/evaluations/reliability.ts` contains 57 labelled synthetic positive/negative cases across operations, agriculture, manufacturing, logistics, education, healthcare administration, retail, hospitality, property, construction, software and personal productivity.

`reliability.integration.test.ts` executes those 57 cases against PostgreSQL and asserts planner, Canvas and assessment agreement. Twelve additional lifecycle cases cover invalid-to-valid recovery, skipped exhaustion, conversation, conflict confirmation, website/Instagram correction, stale immutable reports/PDF, concurrent writes, pruning, failed simulation safeguards, retained restart history, guest restrictions and founder sensitive-context local routing. Fixtures use disposable owners and require the documented \_test database; no database reset is used.

`npm run evaluate` runs 14 original persona assertions and the 57-case pure matrix, writing ignored `.cache/qa/iteration004/acceptance-matrix.json`. Expected/actual disposition, evidence, unknowns, readiness, permissions, recovery, pass/fail and failure details are retained. The isolated suite writes acceptance-api.json separately; the summary imports its timestamp/execution status and does not claim to execute API tests itself. Successful acceptance records and all test execution failures are distinguishable. These are synthetic implementation assertions, not model accuracy percentages or customer outcomes.

Observed browser checks: placeholder correction, uncertain/skipped exhaustion, clarification recovery, preserved conversation handoff, greeting/off-topic handling, explicit website correction confirmation, assessment readiness, explicit report navigation, reopened report, restart and actual PDF download. Two downloaded PDF pages were rendered and visually inspected. Full mobile/accessibility/browser compatibility matrices and live model quality remain unverified. Exact counts/commands are in the iteration 004 report.
