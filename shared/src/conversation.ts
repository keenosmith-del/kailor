import type { DiscoveryPlan } from "./index.js";

export function conversationSuggestions(
  plan: DiscoveryPlan,
  history: { role: string; content: string }[],
): { kind: "message"; label: string; message: string }[] {
  const latest = history.at(-1)?.content ?? "";
  const prompts = /(?:^|\n)2[.)]\s/.test(latest)
    ? [
        "What would the second option involve?",
        "Would the first option be cheaper?",
      ]
    : plan.context.pending.length
      ? ["Can you explain what you understood?"]
      : plan.suggestedPrompts;
  return [...new Set(prompts)].slice(0, 3).map((message) => ({
    kind: "message",
    label: /practical improvement/i.test(message)
      ? "Find a useful improvement"
      : /test this idea/i.test(message)
        ? "Plan idea validation"
        : /clarify the requirements/i.test(message)
          ? "Clarify the scope"
          : /small experiment/i.test(message)
            ? "Plan a small experiment"
            : /second option/i.test(message)
              ? "Explore the second option"
              : /first option.*cheaper/i.test(message)
                ? "Compare costs"
                : /what you understood/i.test(message)
                  ? "Explain these details"
                  : /booking tool|current provider/i.test(message)
                    ? "Explore booking tools"
                    : /smallest version/i.test(message)
                      ? "Define the first version"
                      : /tradeoffs.*offline/i.test(message)
                        ? "Explore offline tradeoffs"
                        : /automate/i.test(message)
                          ? "Explore automation"
                          : /content.*website/i.test(message)
                            ? "Plan website content"
                            : /current site/i.test(message)
                              ? "Improve my current site"
                              : /discuss:/i.test(message)
                                ? "Discuss the next question"
                                : "Explore possible directions",
    message,
  }));
}
