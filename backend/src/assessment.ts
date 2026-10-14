import type {
  Answers,
  Recommendation,
  Report,
} from "../../shared/src/index.js";
import { signalAnswers, buildContext } from "./context-extraction.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { usableAnswers } from "./input-quality.js";
import type { Evidence, AnswerStates } from "../../shared/src/index.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { services } from "../../data/services.js";
import { matchCases, type CaseRecord } from "./library.js";
export function recommend(
  a: Answers,
  pricing: { currency: string; hourlyRate?: number } = { currency: "ZAR" },
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): Recommendation[] {
  const decision = evaluateEvidence(a, evidence, states);
  if (
    !decision.situationKnown ||
    !decision.objectiveKnown ||
    !decision.directions.length
  )
    return [];
  const confirmed = usableAnswers(a, states);
  a = decision.answers;
  const text = Object.values(confirmed).flat().join(" ");
  const simple =
    /affordable|limited|small amount|not complicated|no custom/i.test(text);
  const existingBooking = a.bookingStatus === "existing";
  const explanations: Record<string, string> = {
    presentation: "You want a more credible presentation of your work.",
    modernization: "You described a problem with an existing website.",
    booking: existingBooking
      ? "Improve the existing booking workflow before considering another provider."
      : "Your appointment workflow has described friction; start with a simple workflow or existing scheduling provider.",
    invoices:
      /manual|copy|repetitive|duplicate|several hours|every week|weekly/i.test(
        text,
      )
        ? "Invoice preparation contains demonstrated repetitive work."
        : "You want to explore improving invoice preparation; confirm the current steps before automating.",
    content:
      "Your research or content preparation repeats and requires human review.",
    application:
      "You described intended functionality for an application; validate the smallest useful scope.",
    workflow_exploration:
      "Explore a workflow improvement or feasibility review; specialist requirements and delivery remain unconfirmed.",
  };
  const selected = decision.directions.flatMap((direction) =>
    direction.services.map((id) => ({
      id,
      problem: explanations[direction.id],
      keys: direction.sourceKeys,
      optional: id === "email",
      basis: direction.basis,
    })),
  );
  return selected.map(({ id, problem, keys, optional = false, basis }) => {
    const s = services.find((s) => s.id === id)!;
    const priced =
      pricing.hourlyRate !== undefined &&
      s.hoursLow !== null &&
      s.hoursHigh !== null;
    return {
      serviceId: id,
      problem,
      solution:
        id === "integration" && !existingBooking
          ? "Workflow feasibility and integration review"
          : s.name,
      evidence: keys
        .filter((k) => confirmed[k] !== undefined)
        .map(
          (k) =>
            `${k}: ${Array.isArray(confirmed[k]) ? (confirmed[k] as string[]).join(", ") : confirmed[k]}`,
        ),
      benefits: [s.description],
      alternatives:
        id === "booking" || (existingBooking && id === "integration")
          ? [
              "Improve availability and reminders in the current workflow first",
              "Configure or integrate an existing scheduling provider; compare subscriptions and cancellation controls",
              "Add booking to an existing website only if that channel is useful",
              "Custom booking software requires unique needs; greater engineering and maintenance costs are unlikely to be proportionate initially",
            ]
          : id === "webapp"
            ? [
                "Validate the initial workflow with approved templates and existing software",
                "Prototype a small web application after defining essential users and features",
                "Native mobile requires evidence of device-specific needs and partner feasibility review",
              ]
            : id === "publishing"
              ? [
                  "Use templates and a manual research checklist",
                  /no AI|do not want AI|don.t want AI|no generative AI/i.test(
                    text,
                  )
                    ? "Reuse approved resource libraries with a human content review checklist"
                    : "Consider an AI-assisted pilot only after evaluating sources, privacy, accuracy and cost",
                ]
              : [
                  "Improve the current process first",
                  "Use a suitable existing third-party tool; compare subscriptions, data portability and permissions",
                  "Custom engineering needs a demonstrated gap in existing tools and a maintenance plan",
                ],
      complexity: [
        "webapp",
        "automation",
        "publishing",
        "integration",
      ].includes(id)
        ? simple
          ? "begin with a low-complexity pilot; custom scope requires review"
          : "requires technical scoping"
        : "low to moderate, subject to review",
      dependencies:
        id === "publishing"
          ? [
              "Approved curriculum/templates or sources and content rights",
              "Human review and approval",
              "Separate implementation scope; no scheduler or publication is created",
            ]
          : id === "webapp"
            ? [
                "Essential user roles and initial acceptance criteria",
                "Data privacy, template ownership and review workflow",
                "Hosting, export, maintenance and supported integrations",
              ]
            : id === "booking" || (existingBooking && id === "integration")
              ? [
                  "Current provider permissions and export/integration support",
                  "Availability, reminders and cancellation policy",
                  "Vendor subscription terms and ongoing support",
                ]
              : [
                  "Confirm requirements and ownership",
                  "Confirm ongoing maintenance, hosting and vendor terms",
                ],
      confidence:
        basis === "interpreted"
          ? "conditional — interpreted from the cited user description; confirm scope with the consultant"
          : "conditional — based on self-reported facts; consultant validation required",
      delivery: s.delivery,
      nextSteps: [
        "Review this option with the consultant",
        "Validate constraints, budget and acceptance criteria",
        ...(simple
          ? [
              "Prioritize a small affordable first step; defer complex enhancements",
            ]
          : []),
        ...(buildContext(confirmed).specialistReview
          ? [
              "Specialist domain expertise and delivery capability require review before commitment",
            ]
          : []),
      ],
      optional,
      estimate: {
        status: priced ? "indicative_draft" : "manual_review",
        currency: pricing.currency,
        implementationLow: priced ? s.hoursLow! * pricing.hourlyRate! : null,
        implementationHigh: priced ? s.hoursHigh! * pricing.hourlyRate! : null,
        recurringStatus: "vendor_quote_required",
        notes:
          "Implementation and third-party subscriptions are separate. No binding quotation. Consultant hours must be configured in data/services.ts.",
      },
    };
  });
}
export function createReport(
  a: Answers,
  revision: number,
  synthetic: boolean,
  cases: CaseRecord[],
  pricing?: { currency: string; hourlyRate?: number },
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): Report {
  const raw = a;
  a = usableAnswers(a, states);
  const signals = evaluateEvidence(raw, evidence, states).answers;
  const readiness = evaluateReadiness(raw, evidence, states);
  const matches = matchCases(raw, cases, evidence, states);
  const recommendations = recommend(raw, pricing, evidence, states).map(
    (recommendation) => {
      const reference = matches.find((item) =>
        item.pattern.patterns.includes(recommendation.serviceId),
      );
      const clarification = reference?.pattern.discoveryQuestions?.[0];
      return {
        ...recommendation,
        nextSteps: clarification
          ? [
              ...recommendation.nextSteps,
              `Reference-informed check (${reference!.title}, ${reference!.sourceType}): ${clarification}`,
            ]
          : recommendation.nextSteps,
      };
    },
  );
  const matchedCases = matches.map(
    ({
      id,
      title,
      sourceType,
      reasons,
      reviewStatus,
      limitations,
      usefulness,
    }) => ({
      id,
      title,
      sourceType,
      reasons,
      approvalStatus: reviewStatus,
      limitations,
      usefulness,
    }),
  );
  const val = (key: string) =>
    states[key] && states[key] !== "answered"
      ? `${states[key].replace("_", " ")} — no factual value inferred`
      : Array.isArray(a[key])
        ? (a[key] as string[]).join(", ")
        : String(a[key] ?? "Not confirmed");
  return {
    title: "Your way forward",
    status: readiness.canAssess
      ? readiness.state === "deeper"
        ? "draft solution evaluation — consultant review required"
        : "qualified preliminary draft — consultant review required"
      : "internal discovery notes — insufficient evidence, not an assessment",
    synthetic,
    revision,
    createdAt: new Date().toISOString(),
    recommendations,
    matchedCases,
    sections: [
      {
        title: "Your Situation",
        paragraphs: [
          `Context: ${buildContext(a, evidence).activity || "Not yet understood"}`,
          `Starting point: ${val("stage")}`,
          `Goal: ${a.goals ? val("goals") : a.request ? val("request") : signals.goals ? `Described in a confirmed answer: ${signals.goals}` : val("frustrations")}`,
        ],
      },
      {
        title: "Current Position",
        paragraphs: [
          `Presence: ${signals.presence ? `Described channels: ${String(signals.presence)}` : "Not confirmed"}`,
          `Tools: ${a.tools ? val("tools") : signals.tools ? `Described in a confirmed answer: ${signals.tools}` : "Not confirmed"}`,
          `User-selected challenges: ${val("problems")}`,
          ...buildContext(a, evidence).corrections.map(
            (c) =>
              `Confirmed correction: current ${c.facet} is ${c.currentValue}. Earlier statements are source history, not current facts.`,
          ),
          ...(signals.bookingStatus
            ? [
                `Current booking provider: self-reported ${signals.bookingStatus}; takes precedence over earlier tool descriptions.`,
              ]
            : []),
          ...(a.websiteStatus
            ? [
                `Website status: self-reported ${val("websiteStatus")}; no technical inspection.`,
              ]
            : []),
          ...(a.websiteUrl
            ? [
                `Supplied website: ${val("websiteUrl")}. URL syntax validated only; not fetched, inspected or audited.`,
              ]
            : []),
        ],
      },
      {
        title: "Opportunities",
        paragraphs: recommendations.length
          ? recommendations.map((r) => r.problem)
          : [
              "There is not yet enough confirmed evidence for a solution recommendation. Continue discovery.",
            ],
      },
      {
        title: "Recommended Solutions",
        paragraphs: recommendations.flatMap((r) => [
          `${r.solution}${r.optional ? " (optional)" : ""} — ${r.delivery}`,
          r.problem,
          `Evidence: ${r.evidence.join("; ")}`,
          `Potential benefit: ${r.benefits.join("; ")}`,
          `Confidence: ${r.confidence}`,
        ]),
      },
      {
        title: "Possible Approaches",
        paragraphs: recommendations.flatMap((r) => [
          `${r.solution}: ${r.alternatives.join("; ")}`,
          `Complexity: ${r.complexity}. Dependencies: ${r.dependencies.join("; ")}`,
        ]),
      },
      {
        title: "Costs & Considerations",
        paragraphs: [
          `Budget: ${val("budget")}`,
          `Constraints: ${val("constraints")}`,
          ...recommendations.map(
            (r) =>
              `${r.solution}: ${r.estimate.status}${r.estimate.implementationLow !== null ? ` — ${r.estimate.currency} ${r.estimate.implementationLow}–${r.estimate.implementationHigh}` : ""}. Recurring costs: vendor quote required.`,
          ),
          "All estimates are drafts. Implementation, third-party subscriptions, hosting, domain renewal and recurring maintenance require separate review. Optional future enhancements need their own scope.",
        ],
      },
      {
        title: "Your Way Forward",
        paragraphs: [
          `Timing: ${val("timing")}`,
          `Readiness: ${readiness.canAssess ? (readiness.state === "deeper" ? "deeper evaluation available" : "qualified preliminary assessment available") : "more information required"}. ${readiness.reasons.join(". ")}`,
          ...readiness.uncertainties,
          ...(readiness.criticalUnknowns ?? []).map(
            (item) => `Before implementation: ${item}`,
          ),
          "Review the evidence and unresolved assumptions with the consultant. Choose the smallest useful first step. Confirm scope and costs before implementation.",
          ...recommendations.flatMap((r) =>
            r.nextSteps.map((step) => `${r.solution}: ${step}`),
          ),
          ...matchedCases.map(
            (c) =>
              `Reference only (${c.sourceType}): ${c.title}. ${c.reasons.join("; ")}. No implementation results or ROI are asserted.`,
          ),
        ],
      },
    ],
  };
}
