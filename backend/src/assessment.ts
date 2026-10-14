import type {
  Answers,
  Recommendation,
  Report,
} from "../../shared/src/index.js";
import { signalAnswers, buildContext } from "./context-extraction.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { services } from "../../data/services.js";
import { matchCases, type CaseRecord } from "./library.js";
export function recommend(
  a: Answers,
  pricing: { currency: string; hourlyRate?: number } = { currency: "ZAR" },
): Recommendation[] {
  const confirmed = a;
  a = signalAnswers(a);
  const text = Object.values(confirmed).flat().join(" ");
  const noWebsite = /(?:don.t|do not|no) (?:want|need)(?: a)? website/i.test(
    text,
  );
  const simple =
    /affordable|limited|small amount|not complicated|don.t want a complicated|no custom|no AI/i.test(
      text,
    );
  const existingBooking =
    !/no longer use|don.t (?:have|use) (?:a )?booking|do not (?:have|use) (?:a )?booking/i.test(
      text,
    ) &&
    /(?:already (?:have|use)|existing|use a) (?:a )?(?:booking|scheduling) (?:system|platform|tool)/i.test(
      text,
    );
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
    if (!presence.includes("website") && !noWebsite)
      selected.push({
        id:
          a.kind === "professional" || /portfolio/i.test(text)
            ? "portfolio"
            : "website",
        problem: "You want a more credible presentation of your work.",
        keys: [
          "problems",
          "goals",
          "presence",
          "industry",
          "portfolio",
          "bookingDetails",
        ],
      });
    if (!presence.includes("email"))
      selected.push({
        id: "email",
        problem:
          "A professional contact identity may support your credibility goal.",
        keys: [
          "problems",
          "presence",
          "industry",
          "goals",
          "portfolio",
          "bookingDetails",
        ],
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
  if (
    problems.includes("booking") &&
    (hasDetails("bookingDetails") ||
      /manual bookings?|bookings? manually|appointments? (?:through|via)|easier.*book/i.test(
        text,
      ))
  )
    selected.push({
      id: existingBooking ? "integration" : "booking",
      problem: existingBooking
        ? "Improve the existing booking workflow before considering another provider."
        : "Your appointment workflow has described friction; start with a simple workflow or existing scheduling provider.",
      keys: ["bookingDetails", "tools", "industry", "goals"],
    });
  if (
    problems.includes("invoices") &&
    (hasDetails("invoiceDetails") ||
      (/invoic/i.test(text) &&
        /spreadsheet|manual|repetitive|copy/i.test(text)))
  )
    selected.push({
      id: "automation",
      problem: "Invoice preparation contains repetitive work.",
      keys: ["invoiceDetails", "tools", "goals", "industry"],
    });
  if (
    problems.includes("content") &&
    (hasDetails("contentDetails") ||
      /weekly lesson|recurring research|draft generation/i.test(text))
  )
    selected.push({
      id: "publishing",
      problem: "Your research or content preparation repeats.",
      keys: ["contentDetails", "goals", "request"],
    });
  if (problems.includes("custom") && a.request)
    selected.push({
      id: "webapp",
      problem: "You have described a specific application requirement.",
      keys: ["request", "scopeDetails", "goals"],
    });
  if (
    !selected.length &&
    (hasDetails("workflowDetails") ||
      /\b(?:maintenance|inspections?|repairs?|inventory|logistics|fleet|integrat|operational|manufactur)\b/i.test(
        text,
      )) &&
    (a.goals || a.request || a.frustrations || a.workflowDetails)
  )
    selected.push({
      id: "integration",
      problem:
        "Explore a workflow improvement or existing software integration; delivery and specialist requirements need feasibility review.",
      keys: ["industry", "goals", "request", "workflowDetails", "tools"],
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
        "conditional — based on self-reported facts; consultant validation required",
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
): Report {
  const signals = signalAnswers(a);
  const readiness = evaluateReadiness(a, recommend(a).length);
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
          `Context: ${a.industry ? val("industry") : a.request ? val("request") : val("idea")}`,
          `Starting point: ${val("stage")}`,
          `Goal: ${a.goals ? val("goals") : a.request ? val("request") : signals.goals ? `Described in a confirmed answer: ${signals.goals}` : val("frustrations")}`,
        ],
      },
      {
        title: "Current Position",
        paragraphs: [
          `Presence: ${a.presence ? val("presence") : signals.presence ? `Described channels: ${String(signals.presence)}` : "Not confirmed"}`,
          `Tools: ${a.tools ? val("tools") : signals.tools ? `Described in a confirmed answer: ${signals.tools}` : "Not confirmed"}`,
          `Confirmed challenges: ${val("problems")}`,
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
          `Readiness: ${readiness.state}. ${readiness.reasons.join(". ")}`,
          ...readiness.uncertainties,
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
