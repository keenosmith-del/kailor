# ADR 012 — Explicit cross-plan comparison and isolation

Accepted for iteration 007. Normal inference reads only the authorized active session, its memory and explicitly saved account defaults. It does not enumerate or retrieve another plan's facts. Selecting a plan in the UI never merges evidence.

Natural mentions of another business create a reviewable PlanActionProposal, not a new plan or evidence in the old business. Application-action turns remain in history for auditability but are excluded from later model context and personal summaries. Multiple objectives for one business do not trigger separate plans. The user must choose Create separate plan, Keep discussing current plan, or Cancel. Creation and decision are atomic and use the proposal UUID as their stable creation key.

An explicit `/plans/compare` request accepts exactly two distinct plan UUIDs. Ownership of both is checked before retrieving facts. Return labelled, minimized confirmed requirements and unknowns side by side; no remote inference or evidence writes occur. This comparison is not an official assessment and never mutates either report or its freshness.

Plan actions, selection, summaries, report history and comparisons use the existing founder/guest authorization boundaries. Guests may manage only their own preview plans and may not access private founder plans or remote inference. Composite session-plan ownership prevents reassignment across owners at the database level.
