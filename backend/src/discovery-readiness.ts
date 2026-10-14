import type {
  Answers,
  AnswerStates,
  Evidence,
  Readiness,
} from "../../shared/src/index.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { usableAnswers } from "./input-quality.js";
export function evaluateReadiness(
  a: Answers,
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): Readiness {
  const decision = evaluateEvidence(a, evidence, states);
  const canAssess =
    decision.situationKnown &&
    decision.objectiveKnown &&
    decision.directions.length > 0 &&
    !decision.conflicts.length &&
    !decision.unsupported;
  const criticalUnknowns = canAssess
    ? [...new Set(decision.directions.flatMap((d) => d.limitations))]
    : decision.reasons;
  const useful = usableAnswers(a, states);
  const deep =
    canAssess &&
    !!useful.scopeDetails &&
    !!useful.tools &&
    !!useful.constraints;
  return {
    state: !canAssess
      ? "needs_information"
      : deep
        ? "deeper"
        : decision.unknowns.length
          ? "available_with_uncertainties"
          : "preliminary",
    canAssess,
    reasons: decision.reasons,
    uncertainties: decision.unknowns,
    criticalUnknowns,
    evidenceDirections: decision.directions,
  };
}
