import { extendedConversations } from "../../data/evaluations/conversations.js";
import { MockProvider } from "./ai.js";
import { routeTurn } from "./turn-intent.js";
import { planDiscovery } from "./discovery-planner.js";
import { buildConversationContext } from "./conversation-context.js";
import { memoryEntry, compactMemory } from "./personal-memory.js";
import type { Answers, PersonalMemory } from "../../shared/src/index.js";
export async function plansConversationEvaluation() {
  const results = [];
  for (const scenario of extendedConversations) {
    let answers: Answers = {};
    const history: {
      id: string;
      role: string;
      content: string;
      ordinal: number;
    }[] = [];
    const turns = [];
    for (const [index, turn] of scenario.turns.entries()) {
      const routed = routeTurn(turn.message),
        memory = buildConversationContext(history);
      const old = history
        .slice(0, Math.max(0, history.length - memory.recent.length))
        .flatMap((m) => {
          const e = memoryEntry(m);
          return e ? [e] : [];
        });
      const entries = compactMemory(old);
      const refs = /first|second|earlier|previous|where were/i.test(
        turn.message,
      )
        ? entries
            .filter(
              (e) => e.category === "alternative" || e.category === "decision",
            )
            .slice(-4)
        : [];
      const personal: PersonalMemory = {
        planId: scenario.id,
        sessionId: scenario.id,
        retrieved: refs.map((e) => ({
          id: e.sourceMessageId,
          role: e.role,
          content: history.find((m) => m.id === e.sourceMessageId)!.content,
        })),
        preferences: [],
      };
      const output = await new MockProvider().infer(
        answers,
        turn.message,
        history,
        "conversation",
        { plan: planDiscovery(answers), memory: personal },
      );
      const failures = [];
      if (turn.intent && routed.intent !== turn.intent)
        failures.push(`Expected intent ${turn.intent}; got ${routed.intent}`);
      if (turn.noFacts && output.proposals.length)
        failures.push("A non-factual turn produced proposals");
      if (
        turn.required?.some(
          (key) => !output.proposals.some((p) => p.key === key),
        )
      )
        failures.push("Missing required candidate evidence");
      if (
        turn.forbidden?.some((key) =>
          output.proposals.some((p) => p.key === key),
        )
      )
        failures.push("Temporal or unrelated evidence was promoted");
      if (
        turn.replyTerms?.some(
          (term) => !output.reply.toLowerCase().includes(term.toLowerCase()),
        )
      )
        failures.push(
          "Reply missed the required factual reference or explanation",
        );
      // Explicit synthetic acceptance only; real database authority is independently integration-tested.
      if (turn.confirm)
        answers = {
          ...answers,
          ...Object.fromEntries(output.proposals.map((p) => [p.key, p.value])),
        };
      if (
        !["new_plan", "plan_switch", "cross_plan_comparison"].includes(
          routed.intent,
        )
      )
        history.push(
          {
            id: `${scenario.id}-${index}-u`,
            role: "user",
            content: turn.message,
            ordinal: history.length,
          },
          {
            id: `${scenario.id}-${index}-a`,
            role: "assistant",
            content: output.reply,
            ordinal: history.length + 1,
          },
        );
      turns.push({
        message: turn.message,
        intent: routed.intent,
        reply: output.reply,
        proposals: output.proposals,
        passed: !failures.length,
        failures,
      });
    }
    const failures = [];
    if (
      scenario.ready !== undefined &&
      planDiscovery(answers).readiness.canAssess !== scenario.ready
    )
      failures.push("Unexpected assessment readiness");
    if (
      scenario.retained &&
      !String(answers[scenario.retained.key]).includes(
        scenario.retained.contains,
      )
    )
      failures.push("Lost confirmed constraint or correction");
    results.push({
      id: scenario.id,
      passed: turns.every((t) => t.passed) && !failures.length,
      turns,
      failures,
    });
  }
  return {
    kind: "deterministic multi-turn behavior; live quality is a separate review",
    scenarios: results,
  };
}
