import type {
  Answers,
  Evidence,
  AnswerStates,
  Recommendation,
} from "../../shared/src/index.js";
import { matchCases, type CaseRecord } from "./library.js";
import { contextualStatements } from "./contextual-intelligence.js";
import { evaluateEvidence } from "./evidence-policy.js";

// Cases may change approach comparisons, never the set of evidence-supported service directions.
export function evaluateSolutions(
  a: Answers,
  recommendations: Recommendation[],
  cases: CaseRecord[],
  evidence: Evidence[] = [],
  states: AnswerStates = {},
): Recommendation[] {
  const matches = matchCases(a, cases, evidence, states);
  const current = evaluateEvidence(a, evidence, states).answers;
  return recommendations.map((r) => {
    const references = matches.filter(
      (m) =>
        m.pattern.patterns.includes(r.serviceId) ||
        (r.serviceId === "integration" &&
          current.bookingStatus === "existing" &&
          m.pattern.problems.includes("booking")),
    );
    const alternatives = [...r.alternatives];
    const dependencies = [...r.dependencies];
    const steps = [...r.nextSteps];
    let reason =
      current.bookingStatus === "existing" && r.serviceId === "integration"
        ? "Prefer checking the existing provider: the client already has scheduling technology, so a replacement is not justified by the current evidence."
        : ["integration", "webapp", "automation"].includes(r.serviceId)
          ? "Prefer a feasibility check and existing-tool comparison before custom engineering; required capabilities and maintenance effort are not established."
          : "Prefer a small change addressing the cited objective; expand only after validating the remaining constraints.";
    for (const reference of references) {
      const label = `Reference ${reference.id} v${reference.reviewVersion ?? 0} (${reference.sourceType}; outcome unverified)`;
      // Founder-authored alternatives are review prompts, not feasibility guarantees.
      for (const approach of reference.pattern.approaches ?? []) {
        if (
          approach.serviceId !== r.serviceId &&
          !(r.serviceId === "integration" && approach.serviceId === "booking")
        )
          continue;
        const unsuitable = (approach.unsuitableWhen ?? []).filter(
          (key) => current[key] === "existing" || current[key] === "declined",
        );
        if (unsuitable.length) {
          alternatives.push(
            `${label}: do not adopt ${approach.title} under current ${unsuitable.join(", ")}; validate a different approach.`,
          );
          continue;
        }
        alternatives.push(
          `${label}: compare ${approach.title}. Rationale to validate: ${approach.rationale}`,
        );
        dependencies.push(
          ...(approach.dependencies ?? []).map((d) => `${label}: verify ${d}`),
        );
        reason += ` ${label} supports comparing ${approach.title}, subject to its dependencies and current-client evidence.`;
      }
      steps.push(
        ...(reference.pattern.discoveryQuestions ?? [])
          .slice(0, 2)
          .map((q) => `Reference-informed check — ${label}: ${q}`),
      );
      steps.push(
        ...reference.limitations.map((l) => `${label}: limitation — ${l}`),
      );
    }
    if (
      contextualStatements(a, evidence, states).some(
        (s) =>
          s.status === "confirmed-description" &&
          s.dimensions.includes("offline"),
      )
    ) {
      dependencies.push(
        "Offline record storage, conflict handling, retry/recovery and synchronization require a technical feasibility test",
      );
      reason +=
        " Offline operation rules out assuming an ordinary website or online-only tool will meet the requirement.";
    }
    return {
      ...r,
      alternatives: [...new Set(alternatives)],
      dependencies: [...new Set(dependencies)],
      nextSteps: [reason, ...steps],
    };
  });
}
