import { writeFile, mkdir, readFile } from "node:fs/promises";
import { reliabilityMatrix } from "../backend/src/reliability-evaluation.js";
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

const matrix = reliabilityMatrix();
const directory = ".cache/qa/iteration004";
await mkdir(directory, { recursive: true });
let apiMatrix: unknown[] = [];
let apiExecution: unknown = null;
try {
  const saved = JSON.parse(
    await readFile(`${directory}/acceptance-api.json`, "utf8"),
  );
  apiMatrix = saved.cases;
  apiExecution = {
    generatedAt: saved.generatedAt,
    complete: saved.complete ?? null,
    executions: saved.executions ?? [],
  };
} catch {
  /* API cases are recorded only when the isolated integration suite actually runs. */
}
await writeFile(
  `${directory}/acceptance-matrix.json`,
  JSON.stringify(
    {
      policyVersion: "reliability-2",
      generatedAt: new Date().toISOString(),
      cases: matrix,
      apiCases: apiMatrix,
      apiExecution,
    },
    null,
    2,
  ),
);
for (const result of matrix)
  console.log(
    JSON.stringify({
      evaluation: result.id,
      passed: result.passed,
      disposition: result.actual.disposition,
      canAssess: result.actual.assessmentPermitted,
      failure: result.failureExplanation,
    }),
  );
const reliabilityFailures = matrix.filter((c) => !c.passed).length;
console.log(
  JSON.stringify({
    reliabilityCases: matrix.length,
    failures: reliabilityFailures,
    recordedApiCases: apiMatrix.length,
    artifact: `${directory}/acceptance-matrix.json`,
  }),
);
if (reliabilityFailures) process.exitCode = 1;
