import { personas, seededCases } from "../backend/src/library.js";
import { planDiscovery } from "../backend/src/discovery-planner.js";
import { createReport } from "../backend/src/assessment.js";
import type { Answers } from "../shared/src/index.js";
// Deterministic evaluation: real domain pipeline, no network, no probability claims.
let failed = 0;
for (const p of personas) {
  const a = p.answers as Answers;
  const plan = planDiscovery(a, 1, [], seededCases);
  const report = createReport(a, 1, true, seededCases);
  const ids = report.recommendations.map((r) => r.serviceId);
  const missing = p.expectedServices.filter((id) => !ids.includes(id));
  const unexpected = p.excludedServices.filter((id) => ids.includes(id));
  const ungrounded = report.recommendations
    .filter((r) => !r.evidence.length)
    .map((r) => r.serviceId);
  const passed =
    !missing.length &&
    !unexpected.length &&
    !ungrounded.length &&
    plan.readiness.canAssess;
  if (!passed) failed++;
  console.log(
    JSON.stringify({
      persona: p.id,
      passed,
      missing,
      unexpected,
      ungrounded,
      readiness: plan.readiness.state,
      nextQuestion: plan.question?.id ?? null,
      referenceSources: report.matchedCases.map((c) => c.sourceType),
    }),
  );
}
console.log(
  JSON.stringify({
    fixtures: personas.length,
    failures: failed,
    kind: "synthetic behavior assertions; no real-world outcomes",
  }),
);
if (failed) process.exitCode = 1;
