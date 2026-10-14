import {
  intelligenceCases,
  type IntelligenceCase,
} from "../../data/evaluations/contextual.js";
import { planDiscovery } from "./discovery-planner.js";
import { createReport } from "./assessment.js";
import { seededCases, type CaseRecord } from "./library.js";
export function evaluateIntelligenceCase(c: IntelligenceCase) {
  const plan = planDiscovery(c.confirmedFacts, 1, [], seededCases);
  const report = createReport(c.confirmedFacts, 1, true, seededCases);
  const services = report.recommendations.map((r) => r.serviceId);
  const gaps = plan.ranking.map((r) => r.id);
  const failures = [
    ...c.solutionCategories
      .filter((id) => !services.includes(id))
      .map((id) => `missing solution category ${id}`),
    ...c.unacceptableAssumptions
      .filter((id) => services.includes(id))
      .map((id) => `unsupported ${id}`),
    ...c.usefulFollowUpDimensions
      .filter((id) => !gaps.includes(id))
      .map((id) => `missing decision gap ${id}`),
    ...c.dimensions
      .filter((id) => !plan.context.dimensions?.includes(id))
      .map((id) => `missing dimension ${id}`),
    ...(plan.readiness.canAssess !== c.readiness ? ["readiness differs"] : []),
    ...(report.matchedCases.length > 0 !== c.retrievalRelevant
      ? ["retrieval relevance differs"]
      : []),
  ];
  return {
    ...c,
    actual: {
      services,
      gaps,
      selectedQuestion: plan.question?.id,
      readiness: plan.readiness.canAssess,
      dimensions: plan.context.dimensions,
      references: report.matchedCases.map((m) => m.id),
    },
    passed: !failures.length,
    failureReason: failures.join("; "),
  };
}
export const intelligenceMatrix = () =>
  intelligenceCases.map(evaluateIntelligenceCase);
export const learningPattern: CaseRecord = {
  id: "reviewed-synthetic-booking",
  title: "Independent appointment workflow review",
  sourceType: "synthetic",
  reviewStatus: "approved",
  reviewVersion: 1,
  pattern: {
    industry: "cross-industry",
    problems: ["booking"],
    tools: ["WhatsApp"],
    goals: ["reminders"],
    patterns: ["booking", "website"],
    followUpDimensions: ["bookingCapabilities"],
    discoveryQuestions: [
      "Check whether existing reminder and cancellation settings solve the actual problem before adding another provider.",
    ],
    limitations: [
      "Synthetic source; outcomes unverified",
      "Different provider permissions may prevent integration",
    ],
    approaches: [
      {
        serviceId: "booking",
        title: "Configure current reminders and cancellation controls",
        rationale:
          "Use an existing capability before buying or building a replacement",
        dependencies: [
          "Verify current reminder controls and vendor permissions",
        ],
      },
      {
        serviceId: "website",
        title: "Create a presentation website",
        rationale: "Only when presentation is an unmet objective",
        unsuitableWhen: ["websiteStatus"],
      },
    ],
  },
};
export function learningEvaluation(reference: CaseRecord = learningPattern) {
  const related = {
    problems: ["custom", "booking"],
    stage: "specific",
    industry: "Independent appointment-based service",
    request: "I want a scheduling application to manage customer appointments",
    bookingStatus: "existing",
    websiteStatus: "existing",
    bookingDetails: "Bookings have missed reminders and cancellations",
    goals: "Reduce missed appointments and reminders",
  };
  const baseline = planDiscovery(related, 1, [], []),
    after = planDiscovery(related, 1, [], [reference]);
  const beforeReport = createReport(related, 1, true, []),
    afterReport = createReport(related, 1, true, [reference]);
  // Independent acceptance: inspect current provider before planning another app; retain all current facts;
  // no new site; compare existing reminder controls and explicitly verify vendor permissions.
  const criteria = (plan: typeof baseline, report: typeof beforeReport) => ({
    currentProviderInvestigatedFirst:
      plan.question?.id === "bookingCapabilities",
    noUnjustifiedWebsite: !report.recommendations.some((r) =>
      ["website", "portfolio"].includes(r.serviceId),
    ),
    currentClientFactsPreserved:
      JSON.stringify(plan.context.facts) ===
      JSON.stringify(baseline.context.facts),
    existingReminderAlternative: report.recommendations.some(
      (r) =>
        r.serviceId === "integration" &&
        r.alternatives.some((x) => /reminder|cancellation/i.test(x)),
    ),
    providerPermissionsChecked: report.recommendations.some(
      (r) =>
        r.serviceId === "integration" &&
        r.dependencies.some((x) =>
          /(?:provider|vendor).*permissions?/i.test(x),
        ),
    ),
  });
  const beforeCriteria = criteria(baseline, beforeReport),
    afterCriteria = criteria(after, afterReport);
  const beforeScore = Object.values(beforeCriteria).filter(Boolean).length,
    afterScore = Object.values(afterCriteria).filter(Boolean).length;
  const passes = Object.values(afterCriteria).every(Boolean);
  const changed = baseline.question?.id !== after.question?.id;
  const result =
    afterScore > beforeScore
      ? "improved"
      : afterScore < beforeScore
        ? "degraded"
        : "no_effect";
  return {
    scenario: related,
    baseline: { question: baseline.question?.id, report: beforeReport },
    withApprovedReference: {
      question: after.question?.id,
      report: afterReport,
    },
    criteria: {
      baseline: beforeCriteria,
      withReference: afterCriteria,
      beforeScore,
      afterScore,
      maximumScore: 5,
    },
    acceptancePassed: passes,
    changedQuestion: changed,
    result,
    caveat:
      "Synthetic behavior evaluation; does not establish commercial outcomes or model learning",
  };
}
