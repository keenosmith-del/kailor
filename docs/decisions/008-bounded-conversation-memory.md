# ADR 008 — Bounded conversation memory with evidence remaining authoritative

Accepted for iteration 006.

Cloudflare previously ignored history. Reusing full transcripts would increase disclosure and token use, while model summaries could promote hypotheses to facts.

Build memory on demand from the existing ordinal-ordered messages. Keep at most `AI_CONTEXT_RECENT_MESSAGES` messages (default 12, range 2–30) within `AI_CONTEXT_MAX_CHARACTERS` (default 12000, range 1000–24000). Keep complete messages; stop at the budget boundary rather than clipping an alternative. Only user/assistant roles survive. The newest input is appended once, after history.

When the older range contains at least the configured window count, create a deterministic digest of up to six recent relevant excerpts, each at most 400 characters. Include original source IDs (indices for nonpersistent callers), source range, role and truncation flag. Label all excerpts unconfirmed conversation; current confirmed facts and later corrections take priority. No LLM summarization call, new table, duplicate transcript or persisted raw prompt is needed. Underlying messages remain intact. Missing history gives a usable latest-message/confirmed-context fallback. Ambiguous references require clarification.

System instructions contain policy and public catalogue capabilities. Session values, pending proposals, readiness, skipped keys, correction metadata, bounded approved-reference question hints and recommendation alternatives travel as a separately labelled untrusted data message. They are never interpolated into policy. Remote inference still requires founder authorization, explicit existing opt-in, credentials, privacy checks and an atomic budget reservation. Guests stay local and seed-only. Sensitive-data detection is a supplemental conservative routing check; owner authorization, field selection and bounded disclosure remain essential.

Local fallback resolves only explicit numbered alternatives in its bounded recent window; real model coherence is unverified until live smoke testing. The digest is intentionally lossy and is not a comprehensive semantic summary. Unnumbered, distant or ambiguous alternatives may require clarification. Character limits approximate input size; they do not establish a tokenizer-level total limit or enforce Cloudflare account billing. No paid capability or billing setting is enabled.

Both interaction modes retain the existing evidence writer, readiness evaluator, knowledge revision and immutable report snapshot. Conversation has explicit preparation/navigation actions, avoiding an independent chat-readiness engine.
