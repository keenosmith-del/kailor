import type { Answers, Readiness } from "../../shared/src/index.js";
import { signalAnswers } from "./context-extraction.js";
export function evaluateReadiness(a: Answers, directions: number): Readiness {
  const s = signalAnswers(a);
  const situation = !!(a.industry || a.idea || a.request || a.frustrations);
  const objective = !!(
    s.goals ||
    s.request ||
    s.frustrations ||
    (Array.isArray(s.problems) && s.problems.some((p) => p !== "none"))
  );
  const uncertainties = ["constraints", "budget", "tools", "timing"]
    .filter((k) => !s[k])
    .map((k) => `${k} is unknown or unspecified`);
  if (!situation || !objective || !directions)
    return {
      state: "needs_information",
      canAssess: false,
      reasons: [
        !situation
          ? "Describe the situation or intended users"
          : !objective
            ? "Clarify a practical objective or difficulty"
            : "Clarify the workflow or scope to support a solution direction",
      ],
      uncertainties,
    };
  return {
    state: uncertainties.length
      ? "available_with_uncertainties"
      : a.scopeDetails ||
          a.bookingDetails ||
          a.invoiceDetails ||
          a.contentDetails
        ? "deeper"
        : "preliminary",
    canAssess: true,
    reasons: [
      "A situation and practical objective are described",
      "At least one proportionate direction has supporting evidence",
      "Unknown commercial inputs remain for consultant review",
    ],
    uncertainties,
  };
}
