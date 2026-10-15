import { explorationProgress, isExploration } from "./exploration.js";
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
  const useful = usableAnswers(a, states);
  const exploratory = isExploration(a) && explorationProgress(a) >= 3;
  const ideaReady =
    a.stage === "starting" &&
    typeof useful.idea === "string" &&
    useful.idea.trim().split(/\s+/).length >= 4;
  const canAssess =
    ((exploratory || ideaReady) &&
      !decision.conflicts.length &&
      !decision.unsupported) ||
    (decision.situationKnown &&
      decision.objectiveKnown &&
      decision.directions.length > 0 &&
      !decision.conflicts.length &&
      !decision.unsupported);
  const criticalUnknowns = canAssess
    ? [...new Set(decision.directions.flatMap((d) => d.limitations))]
    : decision.reasons;
  const deep =
    canAssess &&
    !!useful.scopeDetails &&
    !!decision.answers.tools &&
    !!decision.answers.constraints;
  return {
    state: !canAssess
      ? "needs_information"
      : deep
        ? "deeper"
        : decision.unknowns.length
          ? "available_with_uncertainties"
          : "preliminary",
    canAssess,
    reasons: exploratory
      ? [
          "We can prepare an exploration profile. Possibilities remain illustrative until you test them.",
        ]
      : ideaReady && !decision.directions.length
        ? [
            "We can prepare an initial idea assessment with validation steps and open questions.",
          ]
        : decision.reasons,
    uncertainties: exploratory
      ? [
          "Interests, resources and demand remain unverified unless you have described or tested them.",
        ]
      : decision.unknowns,
    unknownFields: ["constraints", "budget", "tools", "timing"].filter(
      (k) => !decision.answers[k],
    ),
    criticalUnknowns,
    evidenceDirections: decision.directions,
  };
}
