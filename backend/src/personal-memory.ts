import { AppError } from "./errors.js";
import { claimsFromText, resolvedFacets } from "./knowledge-conflicts.js";
import type {
  Evidence,
  DiscoveryContext,
  KnowledgeFacet,
} from "../../shared/src/index.js";
import { db } from "./db.js";
import type { Prisma } from "./generated/prisma/client.js";
import { json } from "./session-state.js";
import type { MemoryExcerpt, PersonalMemory } from "../../shared/src/index.js";
import { config } from "./config.js";
import { evaluateInput } from "./input-quality.js";

type SessionScope = {
  id: string;
  planId: string;
  adminId: string;
  knowledgeRevision: number;
  revision: number;
};
export function memoryEntry(m: {
  id: string;
  role: string;
  ordinal: number;
  content: string;
}): MemoryExcerpt | null {
  if (
    !evaluateInput(m.content, "", "chat").accepted ||
    /^(hi|hello|hey|thanks|thank you)[.!]*$/i.test(m.content.trim())
  )
    return null;
  const category = /(?:^|\n)[12][.)]\s|\boption|approach\b/i.test(m.content)
    ? "alternative"
    : /\b(?:decided|prefer|instead|no longer|actually|stopped|shut down)\b/i.test(
          m.content,
        )
      ? "decision"
      : /\?/.test(m.content)
        ? "question"
        : "discussion";
  if (
    category === "discussion" &&
    !/want|need|must|goal|budget|constraint|use|workflow|plan|cost|offline/i.test(
      m.content,
    )
  )
    return null;
  return {
    sourceMessageId: m.id,
    role: m.role,
    ordinal: m.ordinal,
    text: m.content.slice(0, 1200),
    category,
    temporal:
      /used to|stopped|eventually|planning to|no longer|last month/i.test(
        m.content,
      )
        ? "historical-or-planned"
        : "current-or-discussed",
    truncated: m.content.length > 1200,
  };
}
export function compactMemory(entries: MemoryExcerpt[]) {
  const unique = [
    ...new Map(entries.map((e) => [e.sourceMessageId, e])).values(),
  ].sort((a, b) => a.ordinal - b.ordinal);
  // Preserve each category independently so routine recent discussion cannot displace all alternatives.
  const selected = [
    "alternative",
    "decision",
    "question",
    "discussion",
  ].flatMap((category) =>
    unique.filter((e) => e.category === category).slice(-4),
  );
  let size = 0;
  return selected
    .filter((entry) => {
      if (size + entry.text.length > 8000) return false;
      size += entry.text.length;
      return true;
    })
    .sort((a, b) => a.ordinal - b.ordinal);
}
export function reviseMemory(
  entries: MemoryExcerpt[],
  corrections: Pick<
    DiscoveryContext["corrections"][number],
    "facet" | "currentValue"
  >[],
) {
  return entries.map((entry) =>
    claimsFromText(entry.text, "memory").some((claim) =>
      corrections.some(
        (c) => c.facet === claim.facet && c.currentValue !== claim.value,
      ),
    )
      ? { ...entry, temporal: "superseded" as const }
      : entry,
  );
}
export async function updateConversationMemory(
  tx: Prisma.TransactionClient,
  s: SessionScope,
) {
  const tail = await tx.conversationMessage.findMany({
    where: { sessionId: s.id, excludedFromContext: false },
    orderBy: { ordinal: "desc" },
    skip: config.AI_CONTEXT_RECENT_MESSAGES,
    take: 1,
    select: { ordinal: true },
  });
  const through = tail[0]?.ordinal;
  if (through === undefined) return;
  const previous = await tx.conversationSummary.findFirst({
    where: { sessionId: s.id },
    orderBy: { version: "desc" },
  });
  const stale =
    !previous ||
    previous.knowledgeRevision !== s.knowledgeRevision ||
    previous.superseded;
  const count = await tx.conversationMessage.count({
    where: {
      sessionId: s.id,
      excludedFromContext: false,
      ordinal: {
        lte: through,
        ...(!stale && previous ? { gt: previous.throughOrdinal } : {}),
      },
    },
  });
  if (count < config.AI_CONTEXT_RECENT_MESSAGES && !previous) return;
  if (!stale && count < config.AI_CONTEXT_RECENT_MESSAGES) return;
  // Rebuild from bounded relevant older messages after corrections; incremental versions otherwise.
  const records = await tx.conversationMessage.findMany({
    where: {
      sessionId: s.id,
      excludedFromContext: false,
      ordinal: {
        lte: through,
        ...(!stale && previous ? { gt: previous.throughOrdinal } : {}),
      },
    },
    orderBy: { ordinal: "desc" },
    take: 120,
  });
  const rejected = await tx.evidence.findMany({
    where: { sessionId: s.id, status: "rejected" },
    select: { provenance: true },
  });
  const rejectedIds = new Set(
    rejected.map(
      (e) => (e.provenance as { sourceMessageId?: string })?.sourceMessageId,
    ),
  );
  const oldEntries =
    !stale && previous
      ? (previous.content as unknown as { entries: MemoryExcerpt[] }).entries
      : [];
  const entries = compactMemory([
    ...oldEntries,
    ...records
      .filter((m) => !rejectedIds.has(m.id))
      .flatMap((m) => {
        const e = memoryEntry(m);
        return e ? [e] : [];
      }),
  ]);
  const evidence = await tx.evidence.findMany({
    where: { sessionId: s.id, active: true },
  });
  const revisedEntries = reviseMemory(
    entries,
    Object.entries(resolvedFacets(evidence as unknown as Evidence[])).map(
      ([facet, currentValue]) => ({
        facet: facet as KnowledgeFacet,
        currentValue,
      }),
    ),
  );
  await tx.conversationSummary.updateMany({
    where: { sessionId: s.id, superseded: false },
    data: { superseded: true },
  });
  await tx.conversationSummary.create({
    data: {
      sessionId: s.id,
      version: (previous?.version ?? 0) + 1,
      sourceRevision: s.revision,
      knowledgeRevision: s.knowledgeRevision,
      fromOrdinal: entries[0]?.ordinal ?? records.at(-1)!.ordinal,
      throughOrdinal: through,
      content: json({
        authority:
          "unconfirmed conversation references; current confirmed evidence and corrections override every excerpt",
        entries: revisedEntries,
      }),
    },
  });
}
export async function readPersonalMemory(
  s: SessionScope,
  message: string,
): Promise<PersonalMemory> {
  const ownerScope = await db.discoverySession.findFirst({
    where: { id: s.id, adminId: s.adminId, planId: s.planId },
    select: { id: true },
  });
  if (!ownerScope)
    throw new AppError(404, "not_found", "Plan memory not found");
  const summary = await db.conversationSummary.findFirst({
    where: {
      sessionId: s.id,
      knowledgeRevision: s.knowledgeRevision,
      superseded: false,
    },
    orderBy: { version: "desc" },
  });
  const entries = summary
    ? (summary.content as unknown as { entries: MemoryExcerpt[] }).entries
    : [];
  const terms = [...new Set(message.toLowerCase().match(/[\p{L}]{4,}/gu) ?? [])]
    .filter(
      (x) =>
        ![
          "what",
          "would",
          "could",
          "should",
          "about",
          "first",
          "second",
          "option",
          "involve",
          "earlier",
          "remember",
          "please",
          "where",
          "were",
          "know",
          "this",
          "that",
          "have",
          "with",
          "business",
          "plan",
        ].includes(x),
    )
    .slice(0, 5);
  const references =
    /first|second|previous|earlier|decid|where were|remember/i.test(message);
  const tail = await db.conversationMessage.findMany({
    where: { sessionId: s.id, excludedFromContext: false },
    orderBy: { ordinal: "desc" },
    take: config.AI_CONTEXT_RECENT_MESSAGES,
    select: { ordinal: true },
  });
  const boundary = tail.at(-1)?.ordinal ?? 0;
  const rows = terms.length
    ? await db.conversationMessage.findMany({
        where: {
          sessionId: s.id,
          excludedFromContext: false,
          ordinal: { lt: boundary },
          OR: terms.map((term) => ({
            content: { contains: term, mode: "insensitive" as const },
          })),
        },
        orderBy: { ordinal: "desc" },
        take: 4,
      })
    : [];
  const ids = [
    ...new Set([
      ...(references
        ? entries
            .filter(
              (e) => e.category === "alternative" || e.category === "decision",
            )
            .slice(-4)
            .map((e) => e.sourceMessageId)
        : []),
      ...rows.map((m) => m.id),
    ]),
  ];
  const retrieved = ids.length
    ? await db.conversationMessage.findMany({
        where: { sessionId: s.id, id: { in: ids }, excludedFromContext: false },
        orderBy: { ordinal: "asc" },
        select: { id: true, role: true, content: true },
        take: 6,
      })
    : [];
  let retrievedSize = 0;
  const boundedRetrieved = retrieved.filter((m) => {
    if (retrievedSize + m.content.length > 6000) return false;
    retrievedSize += m.content.length;
    return true;
  });
  const prefs = await db.accountPreference.findMany({
    where: { adminId: s.adminId, value: { not: "" } },
    select: { key: true, value: true, revision: true },
    take: 2,
  });
  return {
    planId: s.planId,
    sessionId: s.id,
    ...(summary
      ? {
          summary: {
            id: summary.id,
            version: summary.version,
            knowledgeRevision: summary.knowledgeRevision,
            throughOrdinal: summary.throughOrdinal,
            entries,
          },
        }
      : {}),
    retrieved: boundedRetrieved,
    preferences: prefs,
  };
}
