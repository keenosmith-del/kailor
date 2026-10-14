# ADR 007 — Contextual gaps, knowledge revisions and bounded case influence

Accepted 15 October 2026 for iteration 005.

## Context

The existing session revision protects concurrent mutations but also advances for messages and proposal rejection. Using it as an assessment freshness marker makes greetings invalidate reports. The catalogue planner and reference hints do not adequately distinguish unfamiliar operational requirements or explain how approved experience changes an approach comparison.

## Decision

Keep `revision` as the optimistic-lock and message-order boundary. Add `knowledgeRevision` to sessions and assessments. Advance it for answer/value/state changes, branch removal or a changed resolved interpretation; do not advance it for chat, proposals, rejection or question rewording. Assessment reuse and Canvas snapshots use this knowledge revision. A blocked current assessment is reported separately from the freshness of the historical snapshot. New reports retain the activity revision at creation for traceability.

Build contextual statements and dimensions as projections of answers and evidence. Source keys, evidence IDs, hypothetical/unverified/superseded status and earlier correction provenance remain available. Industry names do not choose an operational pathway. Deterministic information gaps rank optional validated text questions; skips and explicit uncertainty remove those candidates. Keep definition `1.0.0` and its original IDs; new optional IDs are additive. `contextual-3` projections initialize lazily for existing sessions.

Allow an explicitly requested, authorized remote chat response to reword only the currently selected contextual text gap. Validate its ID, topic vocabulary, bounds, answer type, quality and current revision, and save the complete definition and generation provenance. This is constrained model-assisted wording, not arbitrary autonomous question generation. Normal discovery needs no remote model.

Separate current evidence/service eligibility from case-supported approach evaluation. Approved cases may prioritize an independently relevant gap by 80 points, compare supported alternatives, add dependencies, document unsuitable conditions and carry limitations. They cannot create client facts or add an otherwise unsupported service. The reference bonus remains below the offline-feasibility priority. Record reference ID/version/source and an unverified outcome label in immutable reports. Preserve previous approved patterns in transactionally locked review audit history.

## Consequences

An additive migration backfills legacy knowledge revisions conservatively from the old revision counters without changing report JSON. It cannot determine which old revisions were only chat; an already stale legacy report is not automatically made current. Historical reports and source assessments stay immutable when references change.

This is rule-based contextual reasoning plus curated knowledge reuse. It does not establish semantic understanding of all domains, independently verified business facts, commercial outcomes or model training. No embeddings, fine-tuning or new production services are introduced. Privacy heuristics and reply checks are incomplete defenses; explicit confirmation, limited remote context and local fallback remain necessary.
