import type {
  Answers,
  ChatOutput,
  DiscoveryPlan,
  Recommendation,
} from "../../shared/src/index.js";
import { evaluateInput } from "./input-quality.js";
import { planDiscovery } from "./discovery-planner.js";
import { claimsFromText } from "./knowledge-conflicts.js";
import { recommend } from "./assessment.js";
export function localReply(
  context: Answers,
  message: string,
  proposals: ChatOutput["proposals"],
  mode = "conversation",
  savedPlan?: DiscoveryPlan,
  suppliedRecommendations?: Recommendation[],
) {
  const quality = evaluateInput(message, "", "chat"),
    plan = savedPlan ?? planDiscovery(context);
  const text = message.trim();
  const claims = claimsFromText(text, "chat");
  if (
    claims.some((c) =>
      claims.some((x) => x.facet === c.facet && x.value !== c.value),
    )
  )
    return "I heard conflicting statements. Could you clarify which describes your current situation or preference?";
  if (!quality.usableFacts) {
    if (/^(hi|hello|hey|good morning|good afternoon)[.!]*$/i.test(text))
      return plan.context.activity
        ? "Hi. I have your saved context. Would you like to clarify a next step or correct an earlier answer?"
        : "Hi. kailor helps you work out useful technology or workflow changes. What are you working on?";
    if (/^(thanks|thank you)[.!]*$/i.test(text))
      return "You're welcome. We can keep clarifying your situation or return to guided discovery.";
    if (/changed my mind/i.test(text))
      return "Which requirement or preference would you like to change? I'll ask you to confirm the updated information.";
    if (/explain|what do you mean/i.test(text))
      return plan.question?.hint ?? plan.readiness.reasons.join(". ");
    return quality.explanation;
  }
  if (proposals.length)
    return "Please review the details I understood below. Confirm them to update the shared discovery context.";
  if (mode === "analysis") {
    const approaches = (suppliedRecommendations ?? recommend(context))
      .slice(0, 2)
      .map((r) => `${r.solution}: ${r.alternatives.slice(0, 2).join(". ")}`)
      .join(" ");
    if (approaches) return approaches;
  }
  return (
    plan.question?.title ??
    (plan.readiness.canAssess
      ? "There is enough evidence for a qualified preliminary assessment. Prepare it when you are ready."
      : "What is one real task, difficulty or intended outcome we should investigate?")
  );
}
export function containsSensitiveData(text: string) {
  return /\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b|\b(?:sk-|Bearer\s+)[a-z0-9_-]{12,}|\b(?:patient name|national id|credit card number|passport number)\s*[:=]|\b\+?\d[\d ()-]{9,}\d\b/i.test(
    text,
  );
}
