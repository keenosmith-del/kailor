import type { Prisma } from "./generated/prisma/client.js";
import type {
  AnswerValue,
  AnswerState,
  Evidence,
  DiscoveryPlan,
} from "../../shared/src/index.js";
import {
  type StoredSession,
  answersOf,
  statesOf,
  evidenceOf,
  json,
} from "./session-state.js";
import {
  evaluateInput,
  inferResponseState,
  usableAnswers,
} from "./input-quality.js";
import {
  claimsOf,
  detectUpdateConflicts,
  applyResolvedFacets,
} from "./knowledge-conflicts.js";
import {
  validateAnswer,
  pruneAnswers,
  relevant,
  activeQuestions,
} from "./discovery.js";
import { signalAnswers } from "./context-extraction.js";
import { AppError } from "./errors.js";
import { logger } from "./config.js";
export async function writeAnswer(
  refreshPlan: (
    tx: Prisma.TransactionClient,
    id: string,
  ) => Promise<DiscoveryPlan>,
  tx: Prisma.TransactionClient,
  s: StoredSession,
  key: string,
  value: AnswerValue,
  skip: boolean,
  source: string,
  responseState?: AnswerState,
  resolveConflicts = false,
  provenance: Evidence["provenance"] = {},
) {
  const state = responseState ?? inferResponseState(value, skip);
  const selectedSkip = state === "skipped" || skip;
  if (typeof value === "string" && !value.trim() && !selectedSkip) {
    const quality = evaluateInput(value, key);
    throw new AppError(422, "input_quality", quality.explanation, { quality });
  }
  const q = validateAnswer(key, value, selectedSkip);
  if (
    state !== "answered" &&
    q.type !== "text" &&
    !(state === "unknown" && value === "unknown") &&
    !selectedSkip
  )
    throw new AppError(
      400,
      "invalid_response_state",
      "Uncertainty actions apply to text questions",
    );
  if (state === "not_applicable" && !q.optional && !q.allowNotApplicable)
    throw new AppError(
      400,
      "invalid_response_state",
      "This essential question needs context or an uncertainty response",
    );
  const quality = selectedSkip
    ? {
        disposition: "accepted_incomplete" as const,
        issues: ["deliberately_skipped"],
        accepted: true,
        usableFacts: false,
        clarificationRequired: false,
        explanation: "Skipped without making a factual statement",
        recovery: "continue" as const,
      }
    : evaluateInput(value, key);
  if (!quality.accepted) {
    logger.info("input.rejected", {
      sessionId: s.id,
      key,
      issues: quality.issues,
    });
    throw new AppError(422, "input_quality", quality.explanation, { quality });
  }
  const previous = answersOf(s);
  const conflicts = quality.usableFacts
    ? detectUpdateConflicts(
        usableAnswers(previous, statesOf(s)),
        key,
        value,
        evidenceOf(s),
      )
    : [];
  if (
    conflicts.some((c) => c.material) &&
    !resolveConflicts &&
    source !== "chat-confirmed"
  ) {
    logger.info("contradiction.detected", {
      sessionId: s.id,
      key,
      facets: conflicts.map((c) => c.facet),
    });
    throw new AppError(409, "input_conflict", conflicts[0].message, {
      quality: {
        ...quality,
        disposition: "conflict_detected",
        recovery: "confirm_correction",
      },
      conflicts,
    });
  }
  const resolves: Partial<
    Record<import("../../shared/src/index.js").KnowledgeFacet, string>
  > = {};
  for (const claim of claimsOf({ [key]: value }))
    resolves[claim.facet] = claim.value;
  if (
    claimsOf({ [key]: value }).some((c) =>
      claimsOf({ [key]: value }).some(
        (x) => x.facet === c.facet && x.value !== c.value,
      ),
    )
  )
    throw new AppError(
      422,
      "input_quality",
      "This answer contains conflicting statements. Please clarify the current situation.",
      { conflicts: detectUpdateConflicts({ [key]: value }, key, value) },
    );

  if (!relevant(q, signalAnswers(previous)))
    throw new AppError(
      400,
      "irrelevant_question",
      "This question is not active in this pathway",
    );
  const entered = { ...previous, [key]: selectedSkip ? "" : value };
  const effective = applyResolvedFacets(signalAnswers(entered), [
    ...evidenceOf(s),
    {
      id: "pending-write",
      key,
      value,
      status: quality.usableFacts ? "confirmed" : "uncertain",
      source,
      active: true,
      provenance: { resolves },
    },
  ]);
  if (
    quality.usableFacts &&
    resolves.website === "absent" &&
    Array.isArray(entered.presence) &&
    entered.presence.includes("website")
  ) {
    const channels = entered.presence.filter((p) => p !== "website");
    if (channels.length) {
      entered.presence = channels;
      await tx.discoveryAnswer.updateMany({
        where: { sessionId: s.id, questionId: "presence" },
        data: { value: json(channels) },
      });
      await tx.evidence.updateMany({
        where: {
          sessionId: s.id,
          key: "presence",
          active: true,
          status: { not: "inferred" },
        },
        data: { active: false },
      });
      await tx.evidence.create({
        data: {
          sessionId: s.id,
          key: "presence",
          value: json(channels),
          status: "confirmed",
          source: "confirmed-correction",
          provenance: json({
            basis: "dependent-correction",
            quote: String(value),
          }),
        },
      });
    } else delete entered.presence;
  }
  const next = pruneAnswers(entered, effective);
  const previousEffective = applyResolvedFacets(
    signalAnswers(usableAnswers(previous, statesOf(s))),
    evidenceOf(s),
  );
  const changedInterpretation =
    JSON.stringify(previousEffective) !== JSON.stringify(effective);
  const removed = Object.keys(previous).filter((k) => !(k in next));
  if (quality.usableFacts) {
    const superseded = s.evidence
      .filter(
        (e) =>
          e.status === "inferred" &&
          e.key !== key &&
          claimsOf({ [e.key]: e.value as AnswerValue }).some(
            (c) => resolves[c.facet] && resolves[c.facet] !== c.value,
          ),
      )
      .map((e) => e.id);
    if (superseded.length)
      await tx.evidence.updateMany({
        where: { id: { in: superseded } },
        data: { active: false, status: "superseded" },
      });
  }
  const inactiveProposals = s.evidence
    .filter(
      (e) =>
        e.status === "inferred" &&
        !activeQuestions(effective).some((q) => q.id === e.key),
    )
    .map((e) => e.id);
  if (inactiveProposals.length)
    await tx.evidence.updateMany({
      where: { id: { in: inactiveProposals } },
      data: { active: false },
    });
  for (const old of s.evidence.filter((e) => removed.includes(e.key)))
    await tx.evidence.update({
      where: { id: old.id },
      data: {
        provenance: json({
          ...((old.provenance ?? {}) as object),
          retiredReason: "branch_change_or_confirmed_correction",
        }),
      },
    });
  if (removed.length)
    await tx.discoveryAnswer.deleteMany({
      where: { sessionId: s.id, questionId: { in: removed } },
    });
  await tx.evidence.updateMany({
    where: {
      sessionId: s.id,
      active: true,
      OR: [{ key }, { key: { in: removed }, status: { not: "inferred" } }],
    },
    data: { active: false },
  });
  await tx.discoveryAnswer.upsert({
    where: { sessionId_questionId: { sessionId: s.id, questionId: key } },
    create: {
      sessionId: s.id,
      questionId: key,
      value: json(selectedSkip ? "" : value),
      skipped: selectedSkip,
      responseState: state,
      quality: json(quality),
    },
    update: {
      value: json(selectedSkip ? "" : value),
      skipped: selectedSkip,
      responseState: state,
      quality: json(quality),
    },
  });
  if (!selectedSkip)
    await tx.evidence.create({
      data: {
        sessionId: s.id,
        key,
        value: json(value),
        status:
          state === "answered" && quality.usableFacts
            ? "confirmed"
            : state === "not_applicable"
              ? "not_applicable"
              : "uncertain",
        source,
        provenance: json({
          ...provenance,
          confirmedRevision: s.revision + 1,
          quality,
          basis:
            source === "guided"
              ? "explicit"
              : (provenance?.basis ?? "extracted"),
          ...(quality.usableFacts ? { resolves } : {}),
        }),
      },
    });
  await tx.discoverySession.update({
    where: { id: s.id },
    data: {
      revision: { increment: 1 },
      ...(JSON.stringify(previous[key]) !==
        JSON.stringify(selectedSkip ? "" : value) ||
      statesOf(s)[key] !== state ||
      removed.length ||
      changedInterpretation
        ? { knowledgeRevision: { increment: 1 } }
        : {}),
    },
  });
  const updatedPlan = await refreshPlan(tx, s.id);
  logger.info(
    selectedSkip
      ? "question.skipped"
      : conflicts.length
        ? "contradiction.resolved"
        : quality.clarificationRequired
          ? "clarification.requested"
          : "answer.accepted",
    { sessionId: s.id, key, state, completion: updatedPlan.completion.state },
  );
  await tx.auditEvent.create({
    data: {
      actorId: s.adminId,
      action: "answer.updated",
      entityId: s.id,
      details: json({
        key,
        removed,
        source,
        state,
        quality: quality.disposition,
        conflictsResolved: conflicts.map((c) => c.facet),
      }),
    },
  });
}
