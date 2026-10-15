import { evaluateInput } from "./input-quality.js";
import type { ChatOutput } from "../../shared/src/index.js";
// Rules gate application actions. The model may refine conversational intents, never execute actions.
export function routeTurn(message: string): {
  intent: string;
  proposal?: { title: string; description: string };
} {
  const q = evaluateInput(message, "", "chat");
  if (!q.accepted || q.disposition === "off_topic")
    return { intent: "off_topic" };
  if (
    /\bcompare\b[\s\S]*\b(?:both|two|other|plans|businesses)\b/i.test(message)
  )
    return { intent: "cross_plan_comparison" };
  if (
    /\b(?:switch|return|go back|open)\b.*\b(?:plan|business)\b/i.test(message)
  )
    return { intent: "plan_switch" };
  if (
    /\b(?:also (?:starting|start|run|have|opening)|another (?:business|project|plan)|(?:create|start) a (?:separate|new) plan)\b/i.test(
      message,
    )
  ) {
    const title = message
      .match(
        /(?:also (?:starting|start|run|have|opening)(?: an?| my)?|(?:separate|new) plan (?:for|called))\s+(.+?)(?:[.!?]|$)/i,
      )?.[1]
      ?.trim();
    return {
      intent: "new_plan",
      proposal: {
        title: (title ?? "Another project").slice(0, 150),
        description: message.slice(0, 1000),
      },
    };
  }
  if (
    /where were we|what (?:do you know|have we decided|is still missing)|summari[sz]e|what.*understood|did I tell you/i.test(
      message,
    )
  )
    return { intent: "summary" };
  if (
    /actually|changed my mind|no longer|shut down|stopped|instead/i.test(
      message,
    )
  )
    return { intent: "correction" };
  if (/assess/i.test(message)) return { intent: "assessment" };
  if (/^(?:hi|hello|hey|how are you|thanks|thank you)[.!?]*$/i.test(message))
    return { intent: "greeting" };
  if (/\?|^(?:what|how|why|would|could|can|should)\b/i.test(message))
    return {
      intent: /compar|cheaper|versus| or /i.test(message)
        ? "comparison"
        : "question",
    };
  return { intent: "description" };
}
export function safeModelIntent(output: ChatOutput, message: string) {
  const routed = routeTurn(message);
  // Cross-plan and plan-switch actions always require an explicit interface, even if the model disagrees.
  if (
    ["new_plan", "plan_switch", "cross_plan_comparison"].includes(routed.intent)
  )
    return routed;
  if (output.planProposal) {
    const p = output.planProposal;
    if (
      message.includes(p.quote) &&
      /\b(?:another|separate|also|new business)\b/i.test(p.quote) &&
      /business|project|plan/i.test(p.quote)
    )
      return {
        intent: "new_plan",
        proposal: { title: p.title, description: p.quote },
      };
  }
  return {
    intent:
      output.intent &&
      !["new_plan", "plan_switch", "cross_plan_comparison"].includes(
        output.intent,
      )
        ? output.intent
        : routed.intent,
  };
}

export function applicationReply(intent: string) {
  return intent === "new_plan"
    ? "Would you like to start a separate plan for this business or project? Your current plan will stay separate. Review the proposed title below."
    : intent === "plan_switch"
      ? "Choose the plan you want to resume using Change plan. I will keep each plan's knowledge separate."
      : "Use Compare plans under Change plan to select the two plans explicitly. I will show their confirmed requirements separately without changing either plan.";
}
