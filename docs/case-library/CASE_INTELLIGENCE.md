# Case intelligence

Fifteen JSON definitions in `data/scenarios` cover nail services, salons, online sellers, food businesses, trades, creatives, freelancers, consultants, teachers, fitness, invoices, appointments, social-only presence, modernization and editorial research. They include situation, potential challenges, clarification questions, evidence requirements, assumptions, complexity, services and unsuitable conditions. These are hypotheses, not observed results.

Five JSON personas in `data/personas` provide synthetic answers, chat interactions, expected services and excluded services. The CLI and private workspace run the same session/answer/chat/assessment services as the API. Stored runs include definition, answers, actual discovery path, session-linked conversation, report, recommendations and evaluation notes. Running simulations creates pending synthetic cases; it never approves them.

Source and review state are independent. Sources are seed, simulation, real assessment or implementation in the domain design; only seed and simulation ingestion ship. Review status is pending, approved or rejected. Approval never changes `sourceType`, sets verified success or invents outcomes.

Private workspace review requires a title, editable sanitized pattern, status and review notes of at least ten characters. The reviewer must remove identifying details before approval. Source session links stay private; the reusable pattern contains only context terms, goals, tools, challenges, constraints, service patterns and clarification prompts. There is no public export of the case library.

Initial scoring is transparent: confirmed problem overlap +4 each; tool/channel overlap +2 each; goal phrase overlap +2 each; industry relevance +1; shared constraint +1. Require at least 4, return the best 4 with deterministic ID tie-breaking and explicit reasons. Only approved records are retrievable. Exact option matches and simple phrase matching deliberately avoid fabricated semantic precision.

References suggest discovery clarifications and are cited in the report. They do not override current evidence or unlock a service recommendation by themselves. `CaseRetriever` leaves a boundary for future embedding retrieval; vector infrastructure is not included.

The kai persona creates a proposed research → draft → approval → publication design only. No recurring publishing job, external posting or scheduler exists.
