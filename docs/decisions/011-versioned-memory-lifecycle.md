# ADR 011 — Versioned structured memory with scoped older retrieval

Accepted for iteration 007. An on-demand digest alone loses distant alternatives and is regenerated on reads. Persist versioned categorized excerpts, combine them with confirmed knowledge, bounded recent messages and relevant older-message retrieval. Do not add embeddings, a vector database, Redis or a separate inference system.

After a successful turn, refresh memory in a separate serialized transaction. The first summary requires at least one recent-window's worth of older messages (default twelve older plus twelve recent). Subsequent summaries require twelve newly covered older messages, or invalidation. Reads never generate a summary. Refresh failure leaves the successful conversation transaction intact, records a safe fallback event and retains bounded recent context.

Incremental refresh uses the previous valid summary plus up to 120 eligible older messages; invalidated summaries rebuild from that bounded older range. Keep up to four entries per category (alternatives, decisions, questions, discussion), sixteen entries overall, at most 1200 characters per entry and 8000 total text characters. This category retention prevents ordinary discussion from displacing all earlier alternatives. Coverage is a source range, not a claim to have captured every meaning in that range. All summaries remain unconfirmed, lossy conversational memory.

Queries for an earlier reference can retrieve sources preserved by summary and up to four older messages matching at most five useful query terms. Retrieval is session-scoped, at most six messages/6000 characters. Original role and source ID are retained. The normal recent window still obeys `AI_CONTEXT_RECENT_MESSAGES` and `AI_CONTEXT_MAX_CHARACTERS`.

Material confirmed changes supersede summaries transactionally; rejected proposals also invalidate affected continuity memory without staling an otherwise valid report. On the next conversation, rebuild with current corrections and mark conflicting old excerpts superseded. Underlying messages and summary versions remain intact.

No model-assisted summary call is made in this iteration. Structured confirmed state, persistent categorized memory and query-dependent retrieval provide the hybrid foundation without consuming the tightly bounded inference allowance. Optional semantic summaries need separate quality/privacy evaluation before they could improve this deterministic storage strategy. There is no claim of unlimited recall.
