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
  if (
    /too expensive|can.t afford|cost too much|start with something smaller|smaller version/i.test(
      text,
    )
  )
    return "We can narrow the first step and compare existing tools before custom work. Which outcome matters most, and what should we defer? Confirm any revised scope before I update it.";
  if (
    /keep using|replac.*(?:tool|software)|existing tool.*easier|current provider/i.test(
      text,
    )
  )
    return `Keeping useful software is a good option to investigate. ${plan.question?.id === "bookingCapabilities" ? plan.question.title : "Which capability is missing from the current tool, and does it support configuration or integration?"}`;
  if (
    /what if|would.*offline|offline.*tradeoff|tradeoffs?.*offline/i.test(text)
  )
    return "Offline use needs local storage, synchronization and a way to resolve conflicting edits. This is a possibility until you confirm it; which tasks would need to work without a connection?";
  if (
    /actually|instead|no longer|anymore|might be enough/i.test(text) &&
    /app|website|scope/i.test(text)
  )
    return proposals.length
      ? "That could change the scope. Review and confirm the proposed change below before I replace the earlier requirement."
      : "Are you choosing a simpler website as the new scope, or comparing it with the application? Tell me the essential functionality before confirming a replacement.";
  if (
    /what do you mean|explain (?:that|the previous|your last)|earlier answer/i.test(
      text,
    )
  )
    return (
      plan.question?.hint ??
      `Your saved objective is ${String(context.goals ?? context.request ?? "still being clarified")}. ${plan.readiness.reasons.join(". ")}`
    );
  if (/^(?:yes|that one|confirm it|go ahead)[.!]*$/i.test(text))
    return plan.context.pending.length
      ? "Use Confirm on the proposed details below so I update the exact fields you reviewed."
      : "Which option or requirement are you choosing? I will show the proposed update before saving it as confirmed knowledge.";
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
    if (/^(thanks(?:,? that makes sense)?|thank you)[.!]*$/i.test(text))
      return "You're welcome. We can keep clarifying your situation or return to guided discovery.";
    if (/changed my mind/i.test(text))
      return "Which requirement or preference would you like to change? I'll ask you to confirm the updated information.";
    if (/explain|what do you mean/i.test(text))
      return plan.question?.hint ?? plan.readiness.reasons.join(". ");
    return quality.explanation;
  }
  if (proposals.length) {
    const labels: Record<string, string> = {
      industry: "activity",
      goals: "objectives",
      request: "requested scope",
      constraints: "constraints",
      tools: "current tools",
      presence: "current channels",
      problems: "workflow problems",
      aiPreference: "AI preference",
      appPreference: "application scope",
      websitePreference: "website preference",
    };
    const topics = [
      ...new Set(proposals.map((p) => labels[p.key] ?? "requirements")),
    ].slice(0, 3);
    return `I understood an update to your ${topics.join(", ")}. Review the proposed details below and confirm the parts that are current.`;
  }
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
