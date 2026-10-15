# Executed verification — 15 October 2026

All commands below were executed in this checkout. Database integration used only `kailor_test`. Browser testing used a separate API on 5051 and Vite on 5174, with local inference and the test database. Existing application projects were not used as test fixtures.

## Automated checks

| Check                                                                                               | Result                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original baseline `npm test`                                                                        | 274 tests passed before implementation                                                                                                                                 |
| Final `npm test`                                                                                    | 291 tests passed across 7 files                                                                                                                                        |
| `DATABASE_URL=postgresql://kailor:kailor_local@localhost:5432/kailor_test npm run test:integration` | 148 tests passed across 9 files                                                                                                                                        |
| `npm run typecheck`                                                                                 | Passed for all workspaces                                                                                                                                              |
| `npm run build`                                                                                     | Shared/backend TypeScript and Vite production build passed                                                                                                             |
| `npm run evaluate`                                                                                  | Passed: 14 personas, 57 reliability cases, 15 contextual cases, 8 conversation scenarios and 20 project-conversation scenarios, plus the reference-learning comparison |
| Prisma client generation                                                                            | Passed                                                                                                                                                                 |
| Additive migration deployment                                                                       | Passed in `kailor_test`, then configured `kailor`; only the ProjectSource migration was pending                                                                        |

The final integration suite includes the existing authentication, registration, migration, memory, project isolation and immutable-report tests. New tests cover:

- Guest exploration with repeated uncertainty, valid readiness, illustrative report, graph and PDF.
- Existing appointment business with cross-answer Instagram/WhatsApp/calendar recognition, actual objective and technical constraints, practical booking direction, no automatic website recommendation and follow-up explanation.
- Discussing a specifically selected historical exploration report after a later business assessment.
- Discovery reset in the same session/project, stale-revision rejection, preserved Chat-confirmed facts and unchanged historical snapshot bytes.
- UTF-8 CSV extraction, notes, unverified links, private retrieval, resource deletion and source limits.
- Unsupported files, invalid UTF-8/binary text, oversize uploads, instruction attempts and credential-bearing URLs.
- Cross-owner source/report/restart denial and cross-project report discussion rejection before inference.
- Configured guest inference with a stubbed Cloudflare transport; explicit guest opt-out; timeout fallback and rejection of unverified calendar-integration claims.
- Transfer consent, dual-session requirements, ownership cascade, exact report preservation, retained resources, existing account projects, guest token revocation, idempotent retry and expired guest access.
- Equivalent reference deduplication without allowing reference matches to create recommendation evidence.

Tests were updated where the requested behaviour deliberately changed: uncertain journeys begin with motivation; reports have 11 business sections with evidence separated; planner projections use a new cache version; real guest projects are not labelled synthetic; guest inference follows explicit configuration; routine fact suggestions invite optional review instead of forcing confirmation. Existing reference fixtures were preserved, including a legacy uncertain-business persona with explicit operational evidence.

## Practical browser checks

Executed through the app's browser tools:

1. Entered a new isolated guest project, selected “I don’t know where to start”, answered twice with uncertainty, observed the switch to concrete experiment categories, skipped a further question and prepared an exploratory assessment. No existing-business questionnaire or dead end appeared.
2. Opened the exploration report, selected an opportunity canvas node and inspected its detail panel and discussion action.
3. Changed the same project's starting situation to an existing business, entered the complete synthetic nail-technician description and prepared a booking assessment. Cross-answer tools and constraints were recognised; open questions concerned budget/timing, not missing tools. Historical exploration remained visible in report history.
4. Opened the existing-business canvas. Instagram, WhatsApp Business and phone calendar appeared as reported systems. Booking, availability, reminders and calendar compatibility appeared as proposed steps with dependencies and alternatives.
5. Sent an exploratory Chat message and observed the mascot-head/thinking-dots state before a substantive local reply. Empty conversation clearing displayed its notice without a destructive confirmation.
6. Verified mobile Chat at 390 × 844: document width 390, document height 844 and composer visible within the viewport. Verified desktop at 1440 × 900: document width 1440 with no horizontal overflow. Inspected mobile Discovery and reduced the mascot's vertical space after the first visual check.
7. Opened the sidebar, tabbed within it, pressed Escape and verified focus returned to “Open navigation”. Conversations appeared under the active project. The main Chat dropdown was absent.
8. Saved a project decision note in Sources and observed the success state and attributed resource entry. Generated reports appeared separately with specific discussion/download actions.
9. Set the guest explanation preference to plain language, reloaded Settings and observed the persisted selected value. Direct personal-page reload retained the active project heading.

Reduced-motion CSS was inspected and explicitly covers application transitions and thinking dots. A separate operating-system reduced-motion emulation was not run. Full browser-based account registration/transfer and every browser/assistive-technology combination were not exercised; account/transfer semantics were verified through real PostgreSQL HTTP integration tests. No GitHub OAuth end-to-end test is claimed because OAuth is absent.

A screenshot of the verified desktop canvas is saved locally at `.cache/qa/refinement-canvas.jpg`. Browser QA records are temporary, isolated test data; they are not customer examples or reusable approved cases.

## PDF inspection

Generated an A4 synthetic booking assessment using the actual `createReport` and `renderPdf` pipeline. `pdfinfo` confirmed a real two-page PDF. Rendered both pages with Poppler and visually inspected headings, margins, wrapped text, footer numbering and section breaks. A temporary Fontconfig file/cache was needed for the bundled Poppler runtime; this affects QA rendering, not PDF generation. The report separates tools, goals and constraints, qualifies costs, and contains no raw estimate enums or reference-library warnings. Final evidence/layout uses the same customer projection as the report reader. PDF tagging/assistive-technology certification was not performed.

## Live provider verification

Server-side configuration had Cloudflare selected and remote opt-in enabled; account/token were present. Secret values were never printed. The restricted-environment attempt could not connect. Automatic approval review rejected the network retry; the user then explicitly approved **one synthetic appointment-business request** to Cloudflare. That approved request completed with provider `cloudflare`, no fallback and a conversational answer. An invalid proposed fact was discarded independently of its reply.

The response also made an insufficiently qualified calendar-synchronisation statement. The prompt was tightened and a deterministic reply guard plus a regression test now rejects that class of unverified claim. No second live request was made after those changes. Reachability is verified; broad live-model quality and third-party feature compatibility are not. Unit and integration provider-contract tests use stubs, not paid remote calls. No real customer records were sent for this verification.

## Known limits

- Binary PDF/DOCX ingestion and GitHub OAuth remain explicitly unavailable.
- External research URLs are stored but not fetched or verified. Calendar/reminder/channel support and vendor prices must be checked before implementation.
- Reports are deterministic preliminary assessments; no human review or finalisation workflow was invented. Historical snapshot JSON remains immutable, including historical interpretation. Presentation adapters do not silently rewrite it.
- Expired guest access is not recoverable through this workflow; there is no automatic database purge promise.
- Deployment TLS, backups, monitoring, credential recovery, load testing and production accessibility certification were not performed by this local refinement.

Execution logs for the final integration and evaluation runs are in `.cache/qa/refinement-integration.log` and `.cache/qa/refinement-evaluate.log`. These generated logs are ignored. Tracked historical QA artifacts overwritten by legacy test/evaluation scripts were restored from their baseline objects using read-only Git access; no Git index or history changes were made.
