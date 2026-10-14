# ADR 005 — revision-bound deterministic discovery projections

Status: accepted, 14 October 2026.

Keep versioned answers and evidence authoritative. Add nullable JSONB context/plan projections to the existing session rather than introducing another knowledge store or orchestrator. Compute language signals without promoting them to confirmed fields. Persist ranked deterministic question definitions, readiness, reference provenance and source-linked context in the same locked mutation transaction.

Use information-value priorities rather than questionnaire completion. Catalogue definitions remain reusable, with bounded deterministic domain adaptations; do not use an LLM for button selections. Preliminary analysis can coexist with useful follow-ups. Keep explicit preparation/navigation and immutable revision snapshots.

Use approved deterministic case retrieval as curated learning. Require problem/goal/scope overlap, return source/limitations, and keep synthetic classification through review. No embeddings or automatic retraining.

Consequences: stable current-revision refresh and small deployment burden; qualitative ranking and narrow extraction require evaluation and review. Projections are rebuildable caches, not a full event history. Historical definition 1.0.0 remains supported; new optional IDs are additive. Case approval changes take effect on later session mutations rather than rewriting a saved plan. Live inference remains behind existing founder-only opt-in, budget and validation boundaries.
