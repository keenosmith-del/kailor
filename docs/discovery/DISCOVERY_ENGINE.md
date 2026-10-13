# Discovery engine

Definition `1.0.0` lives in `backend/src/discovery.ts`; React renders returned question data. Supported kinds: single option, multiple options and free text. `when` checks known answers, including array membership. Questions can be optional; skipping persists an explicit empty answer and no confirmed evidence.

The initial four choices select established, starting, uncertain and specific pathways. A second context question adds professional portfolio discovery. Presence and problem selections activate website, booking, invoice and recurring content follow-ups. The next question is the first relevant unanswered item in definition order.

Each write validates shape and option membership, takes a session row lock, checks the revision, upserts the answer, deactivates previous evidence for the affected field, and prunes newly irrelevant branch answers/evidence. Common answers survive branch changes. Inactive history remains for auditing but is excluded from current recommendations.

A guided answer is confirmed. A model or mock output is inferred until the consultant clicks Confirm. Confirmation uses the same answer writer, including validation, pruning and revision checks. Changing a confirmed field therefore requires an explicit action. A dismissed proposal becomes inactive and rejected.

Back/edit navigation is a UI selection over backend questions and saved answers. There is no frontend-only branching engine. Unsubmitted text is component state and is not persisted when leaving a view; submitted answers and chat history are persistent. Session version mismatch returns 409; only definition 1.0.0 ships, and future definitions require retained version handlers or a deliberate migration.

Approved references supply explainable optional clarification prompts. References never populate factual answers or silently infer challenges from an industry.

## Iteration 002 interaction changes

Single selections auto-submit using the same IDs and definition rules; multiple selections and text retain explicit submission. Saved single answers can be continued when editing, and failed submissions retain local input. The displayed initial choices are I own a business / I have an idea / I don't know where to start / I know exactly what I want, mapped to the unchanged stage values. No discovery-definition migration is needed.

Completion opens a readiness composition, not an automatic report route. Users explicitly prepare a draft and choose Explore the analysis. A changed revision invalidates that ready presentation; conversation remains available before and after preparation. Guest preview reuses these services with a separate restricted ownership cookie and seed-only reference knowledge.
