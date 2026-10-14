import {
  reliabilityCases,
  type ReliabilityCase,
} from "../../data/evaluations/reliability.js";
import {
  evaluateInput,
  inferResponseState,
  usableAnswers,
} from "./input-quality.js";
import { detectUpdateConflicts, claimsOf } from "./knowledge-conflicts.js";
import { planDiscovery } from "./discovery-planner.js";
import { recommend } from "./assessment.js";
import type {
  Answers,
  AnswerStates,
  Evidence,
  InputQuality,
} from "../../shared/src/index.js";
export function evaluateReliabilityCase(c: ReliabilityCase) {
  let quality: InputQuality =
    c.state === "skipped"
      ? {
          disposition: "accepted_incomplete",
          issues: ["deliberately_skipped"],
          accepted: true,
          usableFacts: false,
          clarificationRequired: false,
          explanation: "Skipped",
          recovery: "continue",
        }
      : evaluateInput(c.input, c.key, c.mode ?? "guided");
  const conflicts = detectUpdateConflicts(c.initial, c.key, c.input);
  const evidence: Evidence[] = [];
  if (conflicts.some((x) => x.material) && !c.confirmCorrection) {
    quality = {
      ...quality,
      disposition: "conflict_detected",
      usableFacts: false,
      recovery: "confirm_correction",
    };
    evidence.push({
      id: "synthetic-pending",
      key: c.key,
      value: c.input,
      status: "inferred",
      source: "evaluation",
      active: true,
      provenance: { conflicts },
    });
  }
  const a: Answers = { ...c.initial };
  const states: AnswerStates = {};
  if (
    c.mode !== "chat" &&
    quality.accepted &&
    quality.disposition !== "conflict_detected"
  ) {
    a[c.key] = c.state === "skipped" ? "" : c.input;
    states[c.key] = c.state ?? inferResponseState(c.input);
    if (quality.usableFacts) {
      const resolves = Object.fromEntries(
        claimsOf({ [c.key]: c.input }).map((x) => [x.facet, x.value]),
      );
      evidence.push({
        id: "synthetic-confirmed",
        key: c.key,
        value: c.input,
        status: "confirmed",
        source: "evaluation",
        active: true,
        provenance: { resolves },
      });
    }
  }
  const plan = planDiscovery(a, 1, evidence, [], states),
    recommendations = recommend(a, undefined, evidence, states);
  const actual = {
    disposition: quality.disposition,
    confirmedEvidence: usableAnswers(a, states),
    usableFacts: quality.usableFacts,
    unknowns: plan.readiness.uncertainties,
    readiness: plan.readiness.state,
    completion: plan.completion.state,
    assessmentPermitted: plan.readiness.canAssess,
    recommendationsPermitted: recommendations.length > 0,
    services: recommendations.map((r) => r.serviceId),
    recovery: quality.recovery,
    conflicts: plan.conflicts.map((x) => x.facet),
  };
  const failures: string[] = [];
  if (actual.disposition !== c.expected.disposition)
    failures.push(
      `disposition: expected ${c.expected.disposition}, got ${actual.disposition}`,
    );
  if (actual.usableFacts !== c.expected.usable)
    failures.push("usable evidence disposition differs");
  if (actual.assessmentPermitted !== c.expected.canAssess)
    failures.push(
      `assessment: expected ${c.expected.canAssess}, got ${actual.assessmentPermitted}`,
    );
  if (actual.recovery !== c.expected.recovery)
    failures.push(
      `recovery: expected ${c.expected.recovery}, got ${actual.recovery}`,
    );
  for (const id of c.expected.services ?? [])
    if (!actual.services.includes(id)) failures.push(`missing service ${id}`);
  for (const id of c.expected.excluded ?? [])
    if (actual.services.includes(id))
      failures.push(`unsupported service ${id}`);
  for (const key of c.expected.unknowns)
    if (!actual.unknowns.some((x) => x.startsWith(key + ":")))
      failures.push(`missing unknown ${key}`);
  if (!c.expected.canAssess && actual.recommendationsPermitted)
    failures.push("recommendations bypassed readiness evidence gates");
  if (
    !quality.usableFacts &&
    c.key &&
    !(c.key in c.initial) &&
    actual.confirmedEvidence[c.key]
  )
    failures.push("unusable input became confirmed evidence");
  return {
    id: c.id,
    initialContext: c.initial,
    input: c.input,
    expected: {
      ...c.expected,
      confirmedEvidence:
        c.expected.usable && c.mode !== "chat"
          ? { ...c.initial, [c.key]: c.input }
          : c.initial,
      recommendationPermitted: c.expected.canAssess,
    },
    actual,
    passed: !failures.length,
    failureExplanation: failures.join("; "),
  };
}
export function reliabilityMatrix() {
  return reliabilityCases.map(evaluateReliabilityCase);
}
