# ADR 010 — Memory scopes and authority

Accepted for iteration 007. Keep four sources separate: recent messages for the active discovery; its confirmed plan knowledge; provenance-bearing older conversational memory; and explicitly reviewed account preferences. Curated Case Intelligence remains an external reference source.

Confirmed current evidence and confirmed corrections override every summary, older message, model hypothesis and account default. Pending evidence is available for clarification only. Rejected-source excerpts are excluded from rebuilt memory; conflicting older claims are marked superseded. Every stored excerpt records source message, role, ordinal, category, temporal classification and truncation. Summaries record session, source/knowledge revision, version and coverage; plan ownership follows the session relation rather than a second mutable owner copy.

No global preference is inferred from a business conversation. Account preference controls explicitly save communication style or a general implementation default, with an optimistic revision and audit record. Clearing a default stores an empty value with its next revision, preventing stale-write resurrection without retaining the cleared preference text. Cleared defaults are omitted from inference. Budgets, timing, tools and operational facts are never account defaults. A current plan's confirmed constraints take priority over saved defaults.

Personal memory cannot create or approve reusable cases. Model-generated assumptions never directly write authoritative answers.
