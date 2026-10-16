import type { Answers, Recommendation } from "../../shared/src/index.js";
import type {
  ConsultingBrief,
  ProjectRequirement,
} from "../../shared/src/consulting.js";
import { operationalPattern } from "./requirements.js";

export function operationalRecommendation(
  a: Answers,
  requirements: ProjectRequirement[],
  currency = "ZAR",
): Recommendation | null {
  const pattern = operationalPattern(a);
  if (!pattern || requirements.length < 2) return null;
  const essential = requirements
    .filter((r) => r.priority === "essential")
    .map((r) => r.label);
  const title = `Evaluate an established ${pattern.platform}`;
  return {
    serviceId: "integration",
    solution: title,
    problem: `Centralise ${pattern.subject.toLowerCase()} around the reported workflow and access needs. Compare established tools against your requirements before commissioning custom software.`,
    evidence: [
      ...new Set(
        requirements.flatMap((r) =>
          r.provenance.map((p) => `${p.sourceKey}: ${p.quote}`),
        ),
      ),
    ],
    benefits: [
      "A shared operational record can reduce scattered information, manual follow-ups and duplicated administration; verify this in a pilot.",
    ],
    alternatives: [
      "Improve the current manual process: inexpensive and familiar, but depends on consistent record keeping and follow-ups; useful as a transition or for low volumes.",
      `Adopt an established ${pattern.platform}: evaluate essential capabilities, permissions and data portability; subscriptions and staff adoption need testing.`,
      "Build custom software: consider only for a demonstrated functional gap in available products; requires engineering, security, maintenance and support capacity.",
    ],
    complexity:
      "Platform configuration and gradual rollout; integration feasibility remains unverified",
    dependencies: [
      ...essential,
      "Verify vendor capability, data portability, connectivity and retention controls",
    ],
    confidence:
      "Based on your reported operation; no vendor capability or pricing has been verified",
    delivery:
      "Evaluate independently or request optional implementation support",
    nextSteps: [
      `Shortlist suitable products and test ${essential.join(", ") || "the proposed capabilities"} against actual work.`,
      "Propose a limited pilot with one operations lead and a small group of staff; agree its size before starting.",
      "Migrate a sample of spreadsheet records, train pilot staff and retain a fallback process during daily operations.",
      "Measure assignment accuracy, update reliability, record completeness and administrative effort; review costs and permissions before expanding.",
    ],
    optional: false,
    estimate: {
      status: "manual_review",
      currency,
      implementationLow: null,
      implementationHigh: null,
      recurringStatus: "vendor_quote_required",
      notes:
        "Upfront costs may include configuration, record migration, training and integrations. Recurring costs may depend on users, staff or vehicles, transaction volume, messages, storage and support. Obtain vendor terms and quotes; no prices have been verified.",
    },
  };
}

export function enrichOperationalBrief(
  brief: ConsultingBrief,
  a: Answers,
): ConsultingBrief {
  const pattern = operationalPattern(a);
  if (!pattern || !brief.directions.some((d) => d.id === "integration"))
    return brief;
  const requirements = brief.requirements ?? [];
  const essential = requirements.filter((r) => r.priority === "essential");
  const direction = brief.directions.find((d) => d.id === "integration")!;
  direction.why = `Your operation has defined workflows and access needs. An established ${pattern.platform} is a proportionate first comparison before custom development. A gradual pilot can test staff adoption and operational benefit without interrupting daily work. ${/established|existing|platform/i.test(String(a.constraints ?? "") + String(a.scopeDetails ?? "")) ? "Your preference for existing tools supports this order of evaluation." : "This is a proposed evaluation direction for your review."}`;
  direction.risks = [
    "Vendor capability and full costs remain unverified.",
    "Staff adoption, connectivity and migration may affect continuity.",
    "Permissions, data protection and retention controls need testing.",
  ];
  direction.requirements = essential.map((r) => r.label);
  const refinedScope = direction.firstStep.startsWith(
    "Test your refined scope:",
  )
    ? direction.firstStep
    : "";
  direction.firstStep =
    refinedScope ||
    "Shortlist suitable platforms and create an acceptance checklist from the essential requirements. Do not include deferred features as first-phase acceptance criteria.";
  direction.validation = [
    {
      kind: "Capability fit",
      action: `Demonstrate ${essential.map((r) => r.label).join(", ") || "the proposed capabilities"} with representative records. Record gaps rather than assuming vendor support.`,
    },
    {
      kind: "Pilot team",
      action:
        "Propose one operations lead and a small group of frontline staff. Agree the pilot size and success criteria before starting.",
    },
    {
      kind: "Real work",
      action:
        "Test actual assignments, progress updates and completion records. Measure accuracy, update reliability, record completeness and administrative time against the current process.",
    },
    {
      kind: "Safe transition",
      action:
        "Import a sample of spreadsheet records, check permissions with each role, train staff and retain a fallback process. Confirm connectivity, recovery and retention needs.",
    },
    {
      kind: "Review",
      action:
        "Compare upfront and recurring costs, data export and support terms. Expand, adjust or discontinue based on the evidence; custom engineering requires a demonstrated functional gap.",
    },
  ];
  direction.continueWhen =
    "Essential requirements work reliably, staff can use the workflow, permissions protect records and verified total costs fit the agreed budget.";
  direction.stopWhen =
    "Essential gaps remain, staff adoption fails, permissions are unsuitable or disruption and total costs outweigh the benefit.";
  brief.summary = `${pattern.subject} need a consistent shared workflow. ${direction.title} to address the reported coordination problems, validate essential capabilities and plan a gradual transition. Vendor fit and costs remain open.`;
  if (direction.status === "deferred" || direction.status === "rejected") {
    const status = direction.status === "rejected" ? "set aside" : "deferred";
    brief.summary = `${pattern.subject}: you have ${status} the proposed platform direction. Your requirements remain recorded; review alternatives and the reasons for this decision before reopening it.`;
    direction.why = `Current decision: ${status}. The original rationale is retained for review: ${direction.why}`;
    direction.firstStep = `Review why this direction was ${status} and explicitly reconsider it before defining a pilot or implementation.`;
  }
  brief.conclusions = [direction.why];
  brief.hypotheses = [
    "The proposed platform approach may improve operational reliability; fit, adoption and technical capability require a pilot.",
  ];
  brief.insights = [
    ...[
      "tools",
      "workflowDetails",
      "accessDetails",
      "dataCaptureDetails",
      "reportingDetails",
      "constraints",
    ].flatMap((key) => {
      const facts = brief.facts.filter((f) => f.sourceKey === key);
      return facts.length
        ? [
            {
              title: facts[0].label,
              summary: [...new Set(facts.map((f) => f.value))]
                .slice(0, 2)
                .join(". "),
            },
          ]
        : [];
    }),
  ];
  const inferredSections = [
    [
      "Business activity",
      /^(?:I run|we (?:run|operate)|a (?:small|local)|our (?:business|company))/i,
    ],
    [
      "Current communications and records",
      /(?:customers? (?:request|submit)|coordinators? record|drivers? use|use.{0,15}(?:spreadsheet|whatsapp))/i,
    ],
    [
      "Operational bottlenecks",
      /missed|scattered|delayed|manual scheduling|follow.up calls|inconsistent/i,
    ],
    [
      "People and access",
      /only see|broader oversight|owner.{0,20}(?:overs|manage)|coordinators? manage/i,
    ],
  ] as const;
  for (const [title, signal] of inferredSections) {
    const values = [
      ...new Set(
        brief.facts
          .filter(
            (f) =>
              signal.test(f.quote) &&
              !brief.insights!.some((i) => i.summary.includes(f.value)),
          )
          .map((f) => f.value),
      ),
    ].slice(0, 2);
    if (values.length)
      brief.insights.push({ title, summary: values.join(". ") });
  }
  brief.approaches = [
    {
      title: "Improve the current manual process",
      strengths: "Familiar tools and a smaller transition.",
      tradeoffs: "Continued manual coordination and fragmented records.",
      appropriateWhen:
        "A temporary bridge or a low-volume workflow with manageable follow-ups.",
    },
    {
      title: `Evaluate an established ${pattern.platform}`,
      strengths:
        "Existing operational features and a pilot before custom engineering.",
      tradeoffs:
        "Vendor fit, subscriptions, migration and adoption remain unverified.",
      appropriateWhen:
        "The essential workflow can be met with proportionate configuration and acceptable terms.",
    },
    {
      title: "Build custom software",
      strengths: "Can address a demonstrated unique workflow.",
      tradeoffs: "Engineering, security, support and maintenance commitments.",
      appropriateWhen:
        "Testing demonstrates a material gap in suitable established products.",
    },
  ];
  brief.unknowns = [
    ...(!a.budget || /not sure|unknown|unconfirmed/i.test(String(a.budget))
      ? ["Budget or investment range."]
      : []),
    ...(!a.timing || /not sure|unknown|unconfirmed/i.test(String(a.timing))
      ? ["Preferred rollout timeframe."]
      : []),
    "Vendor selection, actual capabilities and verified subscription and implementation costs.",
    ...(!a.offlineDetails
      ? ["Connectivity and offline-working requirements."]
      : []),
    "Applicable customer and operational record retention periods.",
    ...requirements
      .filter((r) => r.priority === "unconfirmed")
      .map(
        (r) =>
          `${r.label}: ${r.conflict ?? "confirm whether this is required and its priority."}`,
      ),
  ];
  return brief;
}
