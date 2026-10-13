import type {
  Answers,
  Recommendation,
  Report,
} from "../../shared/src/index.js";
import { services } from "../../data/services.js";
import { matchCases, type CaseRecord } from "./library.js";
export function recommend(
  a: Answers,
  pricing: { currency: string; hourlyRate?: number } = { currency: "ZAR" },
): Recommendation[] {
  const problems = Array.isArray(a.problems) ? a.problems : [];
  const presence = Array.isArray(a.presence) ? a.presence : [];
  const hasDetails = (key: string) =>
    typeof a[key] === "string" &&
    !!(a[key] as string).trim() &&
    (a[key] as string).trim().toLowerCase() !== "not applicable";
  const selected: {
    id: string;
    problem: string;
    keys: string[];
    optional?: boolean;
  }[] = [];
  if (problems.includes("credibility")) {
    if (!presence.includes("website"))
      selected.push({
        id: a.kind === "professional" ? "portfolio" : "website",
        problem: "You want a more credible presentation of your work.",
        keys: ["problems", "goals", "presence"],
      });
    if (!presence.includes("email"))
      selected.push({
        id: "email",
        problem:
          "A professional contact identity may support your credibility goal.",
        keys: ["problems", "presence"],
        optional: true,
      });
  }
  if (
    problems.includes("outdated") &&
    presence.includes("website") &&
    hasDetails("website")
  )
    selected.push({
      id: "modernization",
      problem: "Your existing website needs improvement.",
      keys: ["website", "problems"],
    });
  if (problems.includes("booking") && hasDetails("bookingDetails"))
    selected.push({
      id: "booking",
      problem: "Your appointment workflow has confirmed friction.",
      keys: ["bookingDetails", "tools"],
    });
  if (problems.includes("invoices") && hasDetails("invoiceDetails"))
    selected.push({
      id: "automation",
      problem: "Invoice preparation contains repetitive work.",
      keys: ["invoiceDetails", "tools"],
    });
  if (problems.includes("content") && hasDetails("contentDetails"))
    selected.push({
      id: "publishing",
      problem: "Your research or content preparation repeats.",
      keys: ["contentDetails", "goals"],
    });
  if (problems.includes("custom") && a.request)
    selected.push({
      id: "webapp",
      problem: "You have described a specific application requirement.",
      keys: ["request", "goals"],
    });
  return selected.map(({ id, problem, keys, optional = false }) => {
    const s = services.find((s) => s.id === id)!;
    const priced =
      pricing.hourlyRate !== undefined &&
      s.hoursLow !== null &&
      s.hoursHigh !== null;
    return {
      serviceId: id,
      problem,
      solution: s.name,
      evidence: keys
        .filter((k) => a[k] !== undefined)
        .map(
          (k) =>
            `${k}: ${Array.isArray(a[k]) ? (a[k] as string[]).join(", ") : a[k]}`,
        ),
      benefits: [s.description],
      alternatives:
        id === "publishing"
          ? [
              "Use templates and a manual research checklist",
              "Consider an AI-assisted pilot only after evaluating sources, privacy, accuracy and cost",
            ]
          : [
              "Improve the current process first",
              "Use a suitable existing third-party tool",
            ],
      complexity: ["webapp", "automation", "publishing"].includes(id)
        ? "requires technical scoping"
        : "low to moderate, subject to review",
      dependencies:
        id === "publishing"
          ? [
              "Approved sources and content rights",
              "Human draft review",
              "Separate implementation scope; no scheduler is created",
            ]
          : [
              "Confirm requirements and ownership",
              "Confirm ongoing maintenance and vendor terms",
            ],
      confidence:
        "conditional — based on self-reported facts; consultant validation required",
      delivery: s.delivery,
      nextSteps: [
        "Review this option with the consultant",
        "Validate constraints, budget and acceptance criteria",
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
): Report {
  const matches = matchCases(a, cases);
  const recommendations = recommend(a, pricing).map((recommendation) => {
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
  });
  const matchedCases = matches.map(({ id, title, sourceType, reasons }) => ({
    id,
    title,
    sourceType,
    reasons,
  }));
  const val = (key: string) =>
    Array.isArray(a[key])
      ? (a[key] as string[]).join(", ")
      : String(a[key] ?? "Not confirmed");
  return {
    title: "Your way forward",
    status: "draft — consultant review required",
    synthetic,
    revision,
    createdAt: new Date().toISOString(),
    recommendations,
    matchedCases,
    sections: [
      {
        title: "Your Situation",
        paragraphs: [
          `Context: ${val("industry")}`,
          `Starting point: ${val("stage")}`,
          `Goal: ${val("goals")}`,
        ],
      },
      {
        title: "Current Position",
        paragraphs: [
          `Presence: ${val("presence")}`,
          `Tools: ${val("tools")}`,
          `Confirmed challenges: ${val("problems")}`,
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
          "All estimates are drafts. Implementation, vendor subscriptions and recurring maintenance require separate review.",
        ],
      },
      {
        title: "Your Way Forward",
        paragraphs: [
          `Timing: ${val("timing")}`,
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
