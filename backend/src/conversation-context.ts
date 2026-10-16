import type {
  Answers,
  DiscoveryPlan,
  Recommendation,
} from "../../shared/src/index.js";
import {
  containsSensitiveData,
  privacyScanText,
} from "./conversation-guidance.js";

export type Turn = { role: string; content: string; id?: string };
export type ConversationKnowledge = {
  plan: DiscoveryPlan;
  recommendations?: Recommendation[];
};
export type ContextOptions = {
  recentMessages?: number;
  maxCharacters?: number;
  summaryMessages?: number;
};

// Excerpts are conversation memory, never confirmed evidence. No model call or duplicate persistence.
export function buildConversationContext(
  history: Turn[],
  options: ContextOptions = {},
) {
  const count = Math.max(2, Math.min(30, options.recentMessages ?? 12));
  const budget = Math.max(
    1000,
    Math.min(24000, options.maxCharacters ?? 12000),
  );
  const valid = history
    .map((m, index) => ({ ...m, index }))
    .filter((m) => m.role === "user" || m.role === "assistant");
  let used = 0;
  const recent: typeof valid = [];
  for (const m of valid.slice(-count).reverse()) {
    // Keep complete turns; never truncate a reference into a different meaning.
    if (used + m.content.length > budget) break;
    recent.unshift(m);
    used += m.content.length;
  }
  const boundary = recent[0]?.index ?? history.length;
  const older = valid.filter((m) => m.index < boundary);
  const summary =
    older.length >= count
      ? {
          strategy: "deterministic-excerpts-v1",
          status:
            "unconfirmed conversation; later corrections and confirmed knowledge take priority",
          range: {
            from: older[0].id ?? older[0].index,
            to: older.at(-1)!.id ?? older.at(-1)!.index,
          },
          omittedMessages: older.length,
          excerpts: older
            .filter((m) =>
              /goal|want|need|must|constraint|budget|prefer|actually|instead|option|approach|\?/i.test(
                m.content,
              ),
            )
            .slice(-Math.min(8, options.summaryMessages ?? 6))
            .map((m) => ({
              source: m.id ?? m.index,
              role: m.role,
              excerpt: m.content.slice(0, 400),
              truncated: m.content.length > 400,
            })),
        }
      : null;
  return {
    recent: recent.map(({ role, content }) => ({ role, content })),
    summary,
  };
}

// Explicit numbered alternatives only. Ambiguous references remain unanswered rather than guessed.
export function resolveOption(message: string, history: Turn[]) {
  const ordinal = message
    .match(/\b(first|second|1st|2nd)\b.*\b(one|option|approach)\b/i)?.[1]
    ?.toLowerCase();
  if (!ordinal) return null;
  const last = [...history]
    .reverse()
    .find(
      (m) =>
        m.role === "assistant" &&
        /(?:^|\n)1[.)]\s/.test(m.content) &&
        /\n2[.)]\s/.test(m.content),
    );
  if (!last) return { ordinal, option: null };
  const parts = last.content.split(/(?:^|\n)\d[.)]\s+/).slice(1);
  return {
    ordinal,
    option:
      parts[/first|1st/.test(ordinal) ? 0 : 1]?.split(/\n\s*\n/)[0].trim() ??
      null,
  };
}

export function remoteConversationData(
  context: Answers,
  history: Turn[],
  options: ContextOptions,
) {
  const memory = buildConversationContext(history, options);
  const confirmed = Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !["websiteUrl", "budget", "timing"].includes(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 1000) : value,
      ]),
  );
  if (containsSensitiveData(privacyScanText({ confirmed, memory })))
    throw new Error("sensitive_context_kept_local");
  return { confirmed, ...memory };
}
