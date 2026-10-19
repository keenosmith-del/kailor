import { projectSolutions } from "../../shared/src/solutions.js";
import { consultingBrief } from "./consulting.js";
import {
  canvasStateSchema,
  emptyCanvasState,
} from "../../shared/src/consulting.js";
import { canvasGraph } from "./canvas-model.js";
import { customerReport, reportSummary } from "../../shared/src/report.js";
import { routeTurn, safeModelIntent, applicationReply } from "./turn-intent.js";
import {
  updateConversationMemory,
  readPersonalMemory,
} from "./personal-memory.js";
import { writeAnswer as applyAnswerMutation } from "./answer-mutation.js";
import {
  type StoredSession,
  json,
  answersOf,
  statesOf,
  evidenceOf,
} from "./session-state.js";
import {
  containsSensitiveData,
  privacyScanText,
} from "./conversation-guidance.js";
import { randomUUID } from "node:crypto";
import { evaluateInput, usableAnswers } from "./input-quality.js";
import { claimsOf, detectUpdateConflicts } from "./knowledge-conflicts.js";
import { evaluateEvidence } from "./evidence-policy.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import { logger } from "./config.js";
import { planDiscovery } from "./discovery-planner.js";
import { signalAnswers } from "./context-extraction.js";
import { db } from "./db.js";
import type { Prisma } from "./generated/prisma/client.js";
import { AppError } from "./errors.js";
import {
  activeQuestions,
  questions,
  relevant,
  validateAnswer,
  version,
} from "./discovery.js";
import type {
  Answers,
  AnswerValue,
  Report,
  AnswerStates,
  AnswerState,
  DiscoveryPlan,
  Evidence,
} from "../../shared/src/index.js";
import { createReport, recommend } from "./assessment.js";
import {
  type CaseRecord,
  type SyntheticPersona,
  type Pattern,
  matchCases,
  personas,
  seededCases,
} from "./library.js";
import { config } from "./config.js";
import {
  budgetAvailable,
  CloudflareProvider,
  MockProvider,
  inferSafely,
  remoteEnabled,
} from "./ai.js";
const include = {
  plan: true,
  planProposals: { where: { status: "pending" } },
  subject: true,
  answers: { orderBy: { updatedAt: "asc" as const } },
  messages: { orderBy: { ordinal: "asc" as const } },
  evidence: { where: { active: true }, orderBy: { createdAt: "asc" as const } },
};
export { json, answersOf, statesOf } from "./session-state.js";
export async function getSession(id: string, adminId: string) {
  const s = await db.discoverySession.findFirst({
    where: { id, adminId },
    include,
  });
  if (!s) throw new AppError(404, "not_found", "Session not found");
  if (s.definitionVersion !== version)
    throw new AppError(
      409,
      "definition_version",
      "This session needs its original discovery definition",
    );
  return s;
}
async function lock(
  tx: Prisma.TransactionClient,
  id: string,
  adminId: string,
  revision: number,
  allowArchived = false,
) {
  await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${id} AND "adminId" = ${adminId} FOR UPDATE`;
  const s = await tx.discoverySession.findFirst({
    where: { id, adminId },
    include,
  });
  if (!s) throw new AppError(404, "not_found", "Session not found");
  if (s.plan.archivedAt && !allowArchived)
    throw new AppError(
      409,
      "plan_archived",
      "Restore this plan before changing it",
    );
  if (s.revision !== revision)
    throw new AppError(
      409,
      "revision_conflict",
      "This session changed. Refresh and try again.",
    );
  if (s.definitionVersion !== version)
    throw new AppError(
      409,
      "definition_version",
      "Discovery definition is unavailable",
    );
  return s;
}
export async function createSession(
  adminId: string,
  name: string,
  synthetic = false,
  resumeExisting = false,
) {
  return db.$transaction(async (tx) => {
    if (resumeExisting) {
      await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
      const selection = await tx.accountSettings.findUnique({
        where: { adminId },
        include: { activePlan: true },
      });
      const prior = await tx.discoverySession.findFirst({
        where: {
          adminId,
          plan: { archivedAt: null },
          ...(selection?.activePlan?.lastSessionId
            ? { id: selection.activePlan.lastSessionId }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        include,
      });
      if (prior) return prior;
    }
    const plan = await tx.plan.create({
      data: { adminId, title: name, creationKey: randomUUID() },
    });
    const session = await tx.discoverySession.create({
      data: {
        admin: { connect: { id: adminId } },
        plan: { connect: { id_adminId: { id: plan.id, adminId } } },
        definitionVersion: version,
        synthetic,
        subject: { create: { name, synthetic } },
      },
      include,
    });
    await tx.plan.update({
      where: { id: plan.id },
      data: { lastSessionId: session.id },
    });
    return session;
  });
}
async function writeAnswer(
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
  return applyAnswerMutation(
    persistPlan,
    tx,
    s,
    key,
    value,
    skip,
    source,
    responseState,
    resolveConflicts,
    provenance,
  );
}
export async function submitAnswer(
  id: string,
  adminId: string,
  input: {
    revision: number;
    questionId: string;
    value: AnswerValue;
    skip?: boolean;
    responseState?: AnswerState;
    resolveConflicts?: boolean;
  },
) {
  try {
    await db.$transaction(async (tx) => {
      const s = await lock(tx, id, adminId, input.revision);
      await writeAnswer(
        tx,
        s,
        input.questionId,
        input.value,
        input.skip ?? false,
        "guided",
        input.responseState,
        input.resolveConflicts,
      );
    });
  } catch (e) {
    if (
      e instanceof AppError &&
      e.code === "input_conflict" &&
      e.status === 409
    ) {
      const details = e.details as {
        quality: import("../../shared/src/index.js").InputQuality;
        conflicts: import("../../shared/src/index.js").DiscoveryConflict[];
      };
      const pending = await db.$transaction(async (tx) => {
        await lock(tx, id, adminId, input.revision);
        await tx.evidence.updateMany({
          where: {
            sessionId: id,
            key: input.questionId,
            status: "inferred",
            active: true,
          },
          data: { active: false },
        });
        const proposal = await tx.evidence.create({
          data: {
            sessionId: id,
            key: input.questionId,
            value: json(input.value),
            status: "inferred",
            source: "guided-proposal",
            provenance: json({
              quote: input.value,
              basis: "explicit-proposed-correction",
              quality: details.quality,
              conflicts: details.conflicts,
            }),
          },
        });
        const changed = await tx.discoverySession.update({
          where: { id },
          data: { revision: { increment: 1 } },
        });
        await persistPlan(tx, id);
        await tx.auditEvent.create({
          data: {
            actorId: adminId,
            action: "contradiction.proposed",
            entityId: id,
            details: json({
              key: input.questionId,
              facets: details.conflicts.map((c) => c.facet),
            }),
          },
        });
        return { evidenceId: proposal.id, revision: changed.revision };
      });
      throw new AppError(409, e.code, e.message, { ...details, ...pending });
    }
    if (e instanceof AppError) throw e;
    if (
      e instanceof Error &&
      [
        "Unknown question",
        "Enter a response",
        "Choose a valid option",
        "Choose valid, non-conflicting options",
        "This question is required",
        "Enter a valid public HTTP or HTTPS URL",
      ].includes(e.message)
    )
      throw new AppError(400, "invalid_answer", e.message);
    throw e;
  }
  return getSession(id, adminId);
}
export async function confirmEvidence(
  id: string,
  adminId: string,
  evidenceId: string,
  revision: number,
  accept: boolean,
  editedValue?: AnswerValue,
) {
  await db.$transaction(async (tx) => {
    const s = await lock(tx, id, adminId, revision);
    const e = s.evidence.find(
      (e) => e.id === evidenceId && e.status === "inferred",
    );
    if (!e) throw new AppError(404, "not_found", "Pending proposal not found");
    if (editedValue !== undefined) {
      try {
        validateAnswer(e.key, editedValue);
      } catch {
        throw new AppError(
          400,
          "invalid_answer",
          "The edited value is not valid for this detail",
        );
      }
    }
    if (accept)
      await writeAnswer(
        tx,
        s,
        e.key,
        editedValue ?? (e.value as AnswerValue),
        false,
        "chat-confirmed",
        undefined,
        true,
        editedValue === undefined
          ? (e.provenance as Evidence["provenance"])
          : {
              ...(e.provenance as Evidence["provenance"]),
              quote:
                typeof editedValue === "string"
                  ? editedValue
                  : editedValue.join(", "),
              basis: "user-edited-confirmation",
            },
      );
    else {
      await tx.evidence.update({
        where: { id: e.id },
        data: { active: false, status: "rejected" },
      });
      await tx.conversationSummary.updateMany({
        where: { sessionId: id, superseded: false },
        data: { superseded: true },
      });
      await tx.discoverySession.update({
        where: { id },
        data: { revision: { increment: 1 } },
      });
      await persistPlan(tx, id);
    }
  });
  return getSession(id, adminId);
}
export async function reserveUsage(id: string, mode: string) {
  return db.$transaction(async (tx) => {
    // Global advisory lock makes the daily reservation limit safe across concurrent sessions/processes.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(705050)`;
    const midnight = new Date();
    midnight.setUTCHours(0, 0, 0, 0);
    const [sessionCalls, dailyCalls] = await Promise.all([
      tx.aiUsageRecord.count({
        where: { sessionId: id, provider: "cloudflare" },
      }),
      tx.aiUsageRecord.count({
        where: { provider: "cloudflare", createdAt: { gte: midnight } },
      }),
    ]);
    if (
      !budgetAvailable(
        sessionCalls,
        dailyCalls,
        config.AI_MAX_CALLS_PER_SESSION,
        config.AI_MAX_CALLS_PER_DAY,
      )
    )
      return null;
    return tx.aiUsageRecord.create({
      data: {
        sessionId: id,
        provider: "cloudflare",
        mode,
        status: "reserved",
        reservedTokens: config.AI_MAX_OUTPUT_TOKENS,
      },
    });
  });
}
export async function converse(
  id: string,
  adminId: string,
  input: {
    revision: number;
    message: string;
    mode: string;
    reportId?: string;
    solutionId?: string;
  },
  forceMock = false,
) {
  const s = await getSession(id, adminId);
  if (s.revision !== input.revision)
    throw new AppError(409, "revision_conflict", "Refresh the changed session");
  if (s.plan.archivedAt)
    throw new AppError(
      409,
      "plan_archived",
      "Restore this plan before changing it",
    );
  const currentPlan = await nextForSession(id, adminId);
  if (currentPlan.revision !== s.revision)
    throw new AppError(
      409,
      "revision_conflict",
      "This session changed before conversation planning; please refresh",
    );
  const guest = (
    await db.adminUser.findUniqueOrThrow({ where: { id: adminId } })
  ).isGuest;
  let provider = new MockProvider() as import("./ai.js").AiProvider;
  let reason: string | null = null;
  const routed = routeTurn(input.message);
  const applicationTurn = [
    "new_plan",
    "plan_switch",
    "cross_plan_comparison",
  ].includes(routed.intent);
  const messageQuality = evaluateInput(input.message, "", "chat");
  const personalMemory: import("../../shared/src/index.js").PersonalMemory =
    await readPersonalMemory(s, input.message).catch(() => ({
      planId: s.planId,
      sessionId: s.id,
      retrieved: [],
      preferences: [],
    }));
  let selectedReport: Report | undefined;
  if (
    input.reportId ||
    /assess|report|analys|recommendation/i.test(input.message)
  ) {
    const snapshot = await db.reportSnapshot.findFirst({
      where: {
        ...(input.reportId ? { id: input.reportId } : {}),
        assessment: {
          session: { planId: s.planId, adminId },
          ...(!input.reportId
            ? { sessionId: id, knowledgeRevision: s.knowledgeRevision }
            : {}),
        },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!snapshot && input.reportId)
      throw new AppError(404, "not_found", "Report not found in this project");
    if (snapshot) {
      const report = customerReport(snapshot.content as unknown as Report);
      selectedReport = report;
      personalMemory.retrieved.push({
        id: snapshot.id,
        role: "assistant",
        content: `[Selected saved report; historical advice, not current facts] ${JSON.stringify({ title: report.title, date: report.createdAt, summary: reportSummary(report), sections: report.sections.filter((x) => /recommend|alternative|cost|question|decision/i.test(x.title)) }).slice(0, 4000)}`,
      });
    }
  }
  const sensitive = containsSensitiveData(
    privacyScanText({
      message: input.message,
      memory: personalMemory,
      context: answersOf(s),
      history: s.messages
        .filter((m) => !m.excludedFromContext)
        .map((m) => m.content),
    }),
  );
  const currentCanvas = await canvas(id, adminId);
  const currentSolutions = currentCanvas.solutions;
  if (
    input.solutionId &&
    !currentSolutions.some((s) => s.id === input.solutionId)
  )
    throw new AppError(404, "not_found", "Solution not found in this project");
  const reservation =
    !forceMock &&
    !applicationTurn &&
    routed.intent !== "greeting" &&
    (!guest || config.AI_ALLOW_GUEST_REMOTE === "true") &&
    messageQuality.accepted &&
    messageQuality.disposition !== "off_topic" &&
    !sensitive &&
    remoteEnabled(config)
      ? await reserveUsage(id, input.mode)
      : null;
  if (reservation)
    provider = new CloudflareProvider({
      account: config.CLOUDFLARE_ACCOUNT_ID,
      token: config.CLOUDFLARE_API_TOKEN,
      model: config.CLOUDFLARE_MODEL,
      maxTokens: config.AI_MAX_OUTPUT_TOKENS,
      timeoutMs: config.AI_TIMEOUT_MS,
      contextOptions: {
        recentMessages: config.AI_CONTEXT_RECENT_MESSAGES,
        maxCharacters: config.AI_CONTEXT_MAX_CHARACTERS,
      },
    });
  else
    reason = applicationTurn
      ? "application_action"
      : routed.intent === "greeting"
        ? "local_simple_turn"
        : sensitive
          ? "sensitive_context_kept_local"
          : !messageQuality.usableFacts
            ? "local_conversational_turn"
            : remoteEnabled(config)
              ? "budget_exhausted_or_simulation"
              : "remote_disabled";
  const result = await inferSafely(
    provider,
    answersOf(s),
    input.message,
    s.messages.filter((m) => !m.excludedFromContext),
    input.mode,
    {
      plan: currentPlan,
      solutions: currentSolutions,
      solutionId: input.solutionId,
      memory: personalMemory,
      selectedReport,
      consulting: currentCanvas.consulting,
      recommendations:
        selectedReport?.recommendations ?? currentCanvas.recommendations,
    },
  );
  if (reservation)
    await db.aiUsageRecord.update({
      where: { id: reservation.id },
      data: {
        status: result.fallbackReason ? "failed" : "completed",
        reason: result.fallbackReason,
      },
    });
  const intent = safeModelIntent(result.output, input.message);
  const actionTurn = [
    "new_plan",
    "plan_switch",
    "cross_plan_comparison",
  ].includes(intent.intent);
  if (actionTurn) {
    result.output.proposals = [];
    result.output.followUp = undefined;
    result.output.reply = applicationReply(intent.intent);
  }
  const userMessageId = randomUUID();
  const updateConflicts = result.output.proposals.flatMap((p) =>
    detectUpdateConflicts(
      usableAnswers(answersOf(s), statesOf(s)),
      p.key,
      p.value,
      evidenceOf(s),
    ),
  );
  if (updateConflicts.length)
    result.output.reply = `${updateConflicts[0].message} Please review and confirm the proposed correction below.`;
  await db.$transaction(async (tx) => {
    await lock(tx, id, adminId, input.revision);
    const previousEvidence = await tx.evidence.findMany({
      where: { sessionId: id },
    });
    let createdProposals = 0;
    for (const p of result.output.proposals) {
      if (!messageQuality.usableFacts && !/^set\s/i.test(input.message))
        continue;
      const candidateQuality = evaluateInput(p.value, p.key, "proposal");
      if (!candidateQuality.usableFacts) continue;
      const q = validateAnswer(p.key, p.value);
      if (!relevant(q, signalAnswers(answersOf(s)))) continue;
      if (JSON.stringify(answersOf(s)[p.key]) === JSON.stringify(p.value))
        continue;
      if (
        previousEvidence.some(
          (e) =>
            e.key === p.key &&
            JSON.stringify(e.value) === JSON.stringify(p.value) &&
            (e.status === "rejected" || (e.active && e.status === "inferred")),
        )
      )
        continue;
      await tx.evidence.updateMany({
        where: { sessionId: id, key: p.key, status: "inferred", active: true },
        data: { active: false },
      });
      await tx.evidence.create({
        data: {
          sessionId: id,
          key: p.key,
          value: json(p.value),
          status: "inferred",
          source: result.provider,
          provenance: json({
            quote: p.quote ?? input.message,
            sourceMessageId: userMessageId,
            basis:
              p.basis ??
              (result.provider === "mock-development"
                ? "explicit-extraction"
                : "model-proposal"),
            quality: candidateQuality,
            conflicts: detectUpdateConflicts(
              usableAnswers(answersOf(s), statesOf(s)),
              p.key,
              p.value,
              evidenceOf(s),
            ),
          }),
        },
      });
      createdProposals++;
    }
    if (intent.intent === "new_plan" && intent.proposal) {
      await tx.planActionProposal.updateMany({
        where: { sessionId: id, status: "pending" },
        data: { status: "superseded", decidedAt: new Date() },
      });
      await tx.planActionProposal.create({
        data: {
          sessionId: id,
          sourceMessageId: userMessageId,
          sourceRevision: s.revision,
          title: intent.proposal.title,
          description: intent.proposal.description,
        },
      });
    }
    await tx.conversationMessage.createMany({
      data: [
        {
          id: userMessageId,
          sessionId: id,
          role: "user",
          ordinal: s.revision * 2,
          intent: intent.intent,
          excludedFromContext: actionTurn,
          content: input.message,
          provider: "user",
        },
        {
          sessionId: id,
          role: "assistant",
          ordinal: s.revision * 2 + 1,
          intent: intent.intent,
          excludedFromContext: actionTurn,
          content: result.output.reply,
          provider: result.provider,
        },
      ],
    });
    await tx.discoverySession.update({
      where: { id },
      data: { revision: { increment: 1 } },
    });
    const plan = await persistPlan(tx, id);
    if (
      result.output.followUp &&
      plan.question?.id === result.output.followUp.questionId
    ) {
      const generated = {
        ...plan.question,
        title: result.output.followUp.title,
        hint: result.output.followUp.hint,
      };
      plan.question = generated;
      plan.active = plan.active.map((q) =>
        q.id === generated.id ? generated : q,
      );
      const history = plan.questionHistory ?? [];
      const last = history.at(-1);
      const entry = {
        revision: plan.revision,
        question: generated,
        source: result.provider,
        caseIds: plan.provenance.caseIds,
      };
      if (last?.revision === plan.revision && last.question.id === generated.id)
        history[history.length - 1] = entry;
      else history.push(entry);
      plan.questionHistory = history;
      plan.provenance.generation = {
        provider: result.provider,
        questionId: generated.id,
        sourceRevision: input.revision,
        sourceMessageId: userMessageId,
        validation: "passed",
      };
      await tx.discoverySession.update({
        where: { id },
        data: { planState: json(plan) },
      });
    }
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "conversation.created",
        entityId: id,
        details: json({
          provider: result.provider,
          fallbackReason: result.fallbackReason ?? reason,
          quality: messageQuality.disposition,
          intent: intent.intent,
          routing: applicationTurn
            ? "application-action"
            : reservation
              ? "authorized-model"
              : "local-fallback",
          conflicts: updateConflicts.map((c) => c.facet),
        }),
      },
    });
  });
  await db
    .$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${id} FOR UPDATE`;
      const memoryState = await tx.discoverySession.findUniqueOrThrow({
        where: { id },
      });
      await updateConversationMemory(tx, memoryState);
    })
    .catch(() =>
      logger.info("conversation.memory-fallback", { sessionId: id }),
    );
  logger.info("conversation.quality", {
    sessionId: id,
    disposition: messageQuality.disposition,
    proposalCount: result.output.proposals.length,
    conflicts: updateConflicts.map((c) => c.facet),
    fallback: result.fallbackReason ?? reason,
  });
  return {
    session: await getSession(id, adminId),
    provider: result.provider,
    fallbackReason: result.fallbackReason ?? reason,
    quality: messageQuality,
    intent: intent.intent,
    routing: applicationTurn
      ? "application-action"
      : reservation && !result.fallbackReason
        ? "authorized-model"
        : "local-fallback",
  };
}
export async function referenceCases(adminId?: string): Promise<CaseRecord[]> {
  if (
    adminId &&
    (await db.adminUser.findUnique({ where: { id: adminId } }))?.isGuest
  )
    return seededCases;
  const rows = await db.caseIntelligenceRecord.findMany({
    where: { reviewStatus: "approved" },
  });
  return rows.map((r) => ({ ...r, pattern: r.pattern as unknown as Pattern }));
}
async function persistPlan(tx: Prisma.TransactionClient, id: string) {
  const s = await tx.discoverySession.findUniqueOrThrow({
    where: { id },
    include,
  });
  const guest = (
    await tx.adminUser.findUniqueOrThrow({ where: { id: s.adminId } })
  ).isGuest;
  const cases = guest
    ? seededCases
    : (
        await tx.caseIntelligenceRecord.findMany({
          where: { reviewStatus: "approved" },
        })
      ).map((r) => ({ ...r, pattern: r.pattern as unknown as Pattern }));
  const plan = planDiscovery(
    answersOf(s),
    s.revision,
    s.evidence as unknown as Evidence[],
    cases,
    statesOf(s),
  );
  const prior = s.planState as unknown as DiscoveryPlan | null;
  const history = [...(prior?.questionHistory ?? [])];
  if (!history.length && prior?.question)
    history.push({
      revision: prior.revision,
      question: prior.question,
      source: prior.provenance?.generation?.provider ?? "deterministic",
      caseIds: prior.provenance?.caseIds ?? [],
    });
  const last = history.at(-1);
  if (
    plan.question &&
    (last?.question.id !== plan.question.id ||
      last?.question.title !== plan.question.title)
  )
    history.push({
      revision: plan.revision,
      question: plan.question,
      source: "deterministic",
      caseIds: plan.provenance.caseIds,
    });
  plan.questionHistory = history;
  for (const [key, state] of Object.entries(prior?.questionStates ?? {}))
    if (
      !(key in plan.answerStates) &&
      state !== "not_presented" &&
      !plan.active.some((q) => q.id === key)
    )
      plan.questionStates[key] = "irrelevant";
  await tx.discoverySession.update({
    where: { id },
    data: { contextState: json(plan.context), planState: json(plan) },
  });
  logger.info("discovery.planned", {
    sessionId: id,
    revision: s.revision,
    completion: plan.completion.state,
    nextQuestion: plan.question?.id ?? null,
    matchedCases: plan.provenance.caseIds.length,
    canAssess: plan.readiness.canAssess,
  });
  return plan;
}
export async function nextForSession(
  id: string,
  adminId: string,
): Promise<DiscoveryPlan> {
  const s = await getSession(id, adminId);
  const saved = s.planState as unknown as DiscoveryPlan | null;
  if (
    saved?.revision === s.revision &&
    saved.plannerVersion === "consulting-7" &&
    saved.questionStates &&
    saved.completion
  )
    return saved;
  return db.$transaction(async (tx) => {
    await lock(tx, id, adminId, s.revision, true);
    return persistPlan(tx, id);
  });
}
// Grouped confirmation stays transactional and shares the exact same answer writer as guided discovery.
export async function confirmBatch(
  id: string,
  adminId: string,
  revision: number,
  ids: string[],
  accept: boolean,
) {
  await db.$transaction(async (tx) => {
    let s = await lock(tx, id, adminId, revision);
    if (accept) {
      const selected = s.evidence.filter(
        (e) => ids.includes(e.id) && e.status === "inferred",
      );
      const claims = selected.flatMap((e) =>
        claimsOf({ [e.key]: e.value as AnswerValue }),
      );
      if (
        claims.some((c) =>
          claims.some((x) => x.facet === c.facet && x.value !== c.value),
        )
      )
        throw new AppError(
          422,
          "input_conflict",
          "These proposals contain different statements about the same fact or preference. Confirm the current one individually.",
        );
    }
    for (const evidenceId of ids) {
      const e = s.evidence.find(
        (e) => e.id === evidenceId && e.status === "inferred",
      );
      if (!e)
        throw new AppError(404, "not_found", "Pending proposal not found");
      if (accept)
        await writeAnswer(
          tx,
          s,
          e.key,
          e.value as AnswerValue,
          false,
          "chat-confirmed",
          undefined,
          true,
          e.provenance as Evidence["provenance"],
        );
      else {
        await tx.evidence.update({
          where: { id: e.id },
          data: { active: false, status: "rejected" },
        });
        await tx.conversationSummary.updateMany({
          where: { sessionId: id, superseded: false },
          data: { superseded: true },
        });
        await tx.discoverySession.update({
          where: { id },
          data: { revision: { increment: 1 } },
        });
      }
      s = await tx.discoverySession.findUniqueOrThrow({
        where: { id },
        include,
      });
    }
    await persistPlan(tx, id);
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "evidence.batch-reviewed",
        entityId: id,
        details: json({ ids, accept }),
      },
    });
  });
  return getSession(id, adminId);
}
export async function assess(id: string, adminId: string, revision: number) {
  const cases = await referenceCases(adminId);
  const result = await db.$transaction(async (tx) => {
    const s = await lock(tx, id, adminId, revision);
    const existing = await tx.assessment.findFirst({
      where: { sessionId: id, knowledgeRevision: s.knowledgeRevision },
      orderBy: { createdAt: "desc" },
      include: { report: true },
    });
    const a = answersOf(s);
    const savedPlan = s.planState as unknown as DiscoveryPlan | null;
    const plan =
      savedPlan?.revision === s.revision &&
      savedPlan.plannerVersion === "consulting-7"
        ? savedPlan
        : await persistPlan(tx, id);
    if (!plan.readiness.canAssess) {
      logger.info("assessment.blocked", {
        sessionId: id,
        revision,
        state: plan.completion.state,
      });
      throw new AppError(
        422,
        "insufficient_evidence",
        "More useful evidence or clarification is needed before preparing an assessment",
        { readiness: plan.readiness, completion: plan.completion },
      );
    }
    if (existing) return existing;
    const content = createReport(
      a,
      revision,
      s.synthetic,
      cases,
      {
        currency: config.ESTIMATE_CURRENCY,
        hourlyRate: config.ESTIMATE_HOURLY_RATE,
      },
      evidenceOf(s),
      statesOf(s),
      s.plan.canvasState,
    );
    const preferences = await tx.accountPreference.findMany({
      where: { adminId },
      select: { key: true, value: true },
    });
    if (content.consulting) {
      content.consulting.decisions.push(
        ...preferences.map((p) => ({
          title: p.key,
          notes: p.value,
          status: "account preference",
        })),
      );
      const implementation = preferences.find(
        (p) => p.key === "implementationPreference",
      );
      if (implementation)
        content.consulting.conclusions.push(
          implementation.value === "existing-tools-first"
            ? "Compare existing tools before considering custom implementation."
            : "Consider custom implementation only when a demonstrated requirement is not met by existing tools.",
        );
    }
    const assessment = await tx.assessment.create({
      data: {
        sessionId: id,
        sessionRevision: revision,
        knowledgeRevision: s.knowledgeRevision,
        summary: content.sections[0].paragraphs.join("\n"),
        report: { create: { content: json(content) } },
        recommendations: {
          create: content.recommendations.map((r) => ({
            ...r,
            evidence: json(r.evidence),
            benefits: json(r.benefits),
            alternatives: json(r.alternatives),
            dependencies: json(r.dependencies),
            nextSteps: json(r.nextSteps),
            estimate: { create: r.estimate },
          })),
        },
      },
      include: { report: true },
    });
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "assessment.created",
        entityId: assessment.id,
        details: json({ revision, synthetic: s.synthetic }),
      },
    });
    return assessment;
  });
  return {
    assessmentId: result.id,
    reportId: result.report!.id,
    content: result.report!.content as unknown as Report,
  };
}
export async function getReport(id: string, adminId: string) {
  const s = await getSession(id, adminId);
  const report = await db.reportSnapshot.findFirst({
    where: { assessment: { sessionId: id } },
    orderBy: { createdAt: "desc" },
    include: { assessment: true },
  });
  if (!report)
    throw new AppError(404, "report_missing", "Prepare an assessment first");
  return {
    reportId: report.id,
    content: report.content as unknown as Report,
    stale: report.assessment.knowledgeRevision !== s.knowledgeRevision,
    assessmentBlocked: !evaluateReadiness(
      answersOf(s),
      evidenceOf(s),
      statesOf(s),
    ).canAssess,
  };
}
export async function canvas(id: string, adminId: string) {
  const s = await getSession(id, adminId);
  const readiness = evaluateReadiness(answersOf(s), evidenceOf(s), statesOf(s));
  const preview = createReport(
    answersOf(s),
    s.revision,
    s.synthetic,
    await referenceCases(adminId),
    undefined,
    evidenceOf(s),
    statesOf(s),
    s.plan.canvasState,
  );
  const snapshot = await db.reportSnapshot.findFirst({
    where: {
      assessment: { sessionId: id, knowledgeRevision: s.knowledgeRevision },
    },
    include: { assessment: true },
    orderBy: { createdAt: "desc" },
  });
  const content = readiness.canAssess
    ? ((snapshot?.content as unknown as Report | undefined) ?? preview)
    : { ...preview, recommendations: [] };
  const liveState = canvasStateSchema.safeParse(s.plan.canvasState);
  const state = liveState.success ? liveState.data : emptyCanvasState();
  const graph = canvasGraph(
    evaluateEvidence(answersOf(s), evidenceOf(s), statesOf(s)).answers,
    { ...content, consulting: preview.consulting },
  );
  for (const node of graph.nodes) {
    const edit = state.edits[node.id];
    if (edit?.title) node.title = edit.title;
    if (edit?.notes) node.purpose = edit.notes;
    if (edit?.priority || edit?.decision)
      node.decision = edit.priority ?? edit.decision;
  }
  for (const original of state.additions) {
    if (graph.nodes.some((n) => n.id === original.id)) continue;
    const addition = {
      ...original,
      title: state.edits[original.id]?.title ?? original.title,
      notes: state.edits[original.id]?.notes ?? original.notes,
    };
    graph.nodes.push({
      id: addition.id,
      title: addition.title,
      purpose: addition.notes,
      status: "reported",
      group:
        addition.kind === "idea"
          ? "directions"
          : addition.kind === "decision"
            ? "next"
            : "context",
      evidence: [],
      dependencies: [],
      alternatives: [],
      decision: "user-added",
    });
    if (graph.nodes[0])
      graph.edges.push({
        from: graph.nodes[0].id,
        to: addition.id,
        label: `you added a ${addition.kind}`,
      });
  }
  const solutions = projectSolutions(
    {
      ...preview,
      recommendations: readiness.canAssess ? preview.recommendations : [],
      consulting: readiness.canAssess ? preview.consulting : undefined,
    },
    state,
    s.knowledgeRevision,
  );
  const requests = await db.consultancyRequest.findMany({
    where: { planId: s.planId, ownerId: adminId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  for (const solution of solutions) {
    const request = requests.find((r) =>
      (r.scope as unknown as { solutions: { id: string }[] }).solutions.some(
        (ref) => ref.id === solution.id,
      ),
    );
    if (request)
      solution.request = {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        scopeRevision: (
          request.scope as unknown as {
            solutions: { id: string; revision: number }[];
          }
        ).solutions.find((ref) => ref.id === solution.id)!.revision,
      };
  }
  return {
    revision: s.revision,
    readiness,
    source: snapshot && readiness.canAssess ? "snapshot" : "validated-preview",
    projectRevision: s.plan.revision,
    solutions,
    state: canvasStateSchema.safeParse(s.plan.canvasState).success
      ? canvasStateSchema.parse(s.plan.canvasState)
      : emptyCanvasState(),
    consulting: preview.consulting,
    recommendations: preview.recommendations,
    graph,
    existing: (evaluateEvidence(answersOf(s), evidenceOf(s), statesOf(s))
      .answers.presence ?? []) as string[],
    existingOrigin: answersOf(s).presence
      ? "confirmed-selection"
      : signalAnswers(answersOf(s)).presence
        ? "described"
        : "unknown",
    components: content.recommendations.map((r) => ({
      id: r.serviceId,
      title: r.solution,
      delivery: r.delivery,
      rationale: r.nextSteps[0],
      kind:
        r.serviceId === "publishing"
          ? "future"
          : r.optional
            ? "optional"
            : "core",
      complexity: r.complexity,
      dependencies: r.dependencies,
      evidence: r.evidence,
    })),
    note: !readiness.canAssess
      ? readiness.reasons.join(". ")
      : snapshot
        ? "Components from the saved assessment snapshot. No implementation is implied."
        : "Qualified directions from validated evidence; prepare an assessment to save a report. No implementation is implied.",
  };
}
export async function simulate(
  adminId: string,
  personaId: string,
  definition?: SyntheticPersona,
) {
  const persona = definition ?? personas.find((p) => p.id === personaId);
  if (!persona) throw new AppError(404, "persona_missing", "Persona not found");
  let s = await createSession(adminId, persona.name, true);
  const path: {
    questionId: string;
    title: string;
    value: AnswerValue;
    skipped: boolean;
    revision: number;
    source: string;
  }[] = [];
  try {
    let q = (await nextForSession(s.id, adminId)).question;
    while (q) {
      const value = (persona.answers as Answers)[q.id];
      if (value === undefined && !q.optional)
        throw new AppError(422, "fixture_missing", `Persona needs ${q.id}`);
      s = await submitAnswer(s.id, adminId, {
        revision: s.revision,
        questionId: q.id,
        value: value ?? "",
        skip: value === undefined,
      });
      path.push({
        questionId: q.id,
        title: q.title,
        value: value ?? "",
        skipped: value === undefined,
        revision: s.revision,
        source: "deterministic",
      });
      q = (await nextForSession(s.id, adminId)).question;
    }
    // Additional fixture details are voluntary context, not required form completion.
    for (const [key, value] of Object.entries(persona.answers)) {
      if (key in answersOf(s)) continue;
      const q = questions.find(
        (q) => q.id === key && relevant(q, signalAnswers(answersOf(s))),
      );
      if (!q) continue;
      s = await submitAnswer(s.id, adminId, {
        revision: s.revision,
        questionId: key,
        value: value as AnswerValue,
      });
    }
    for (const message of persona.chat)
      s = (
        await converse(
          s.id,
          adminId,
          { revision: s.revision, message, mode: "conversation" },
          true,
        )
      ).session;
    const assessment = await assess(s.id, adminId, s.revision);
    const got = assessment.content.recommendations.map((r) => r.serviceId);
    const missing = persona.expectedServices.filter((x) => !got.includes(x)),
      unexpected = persona.excludedServices.filter((x) => got.includes(x));
    const notes = `Synthetic regression: missing expected [${missing.join(", ")}]; unexpected [${unexpected.join(", ")}]. No commercial outcome. Human evaluation required.`;
    return db.$transaction(async (tx) => {
      const run = await tx.simulationRun.create({
        data: {
          personaId,
          persona: json(persona),
          sessionId: s.id,
          discoveryPath: json(path),
          assessmentId: assessment.assessmentId,
          evaluationNotes: notes,
        },
      });
      const a = answersOf(s);
      if (!missing.length && !unexpected.length)
        await tx.caseIntelligenceRecord.create({
          data: {
            sourceType: "simulation",
            sourceRunId: run.id,
            title: `Synthetic reference: ${persona.name}`,
            pattern: json({
              industry: String(a.industry ?? ""),
              problems: signalAnswers(a).problems ?? [],
              tools: [],
              goals: [],
              constraints: /affordable|limited|small/i.test(
                String(a.constraints ?? ""),
              )
                ? ["affordable"]
                : [],
              stage: String(a.stage ?? "unknown"),
              limitations: [
                "Synthetic assessment; no observed customer outcome",
                "Validate current workflow and constraints before reuse",
              ],
              patterns: got,
              discoveryQuestions: [
                "Which part of the current workflow is actually causing friction?",
              ],
            }),
          },
        });
      return {
        ...run,
        report: assessment.content,
        passed: missing.length === 0 && unexpected.length === 0,
      };
    });
  } catch (error) {
    if (!(error instanceof AppError) || error.status >= 500) throw error;
    s = await getSession(s.id, adminId);
    const failure = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
    const run = await db.simulationRun.create({
      data: {
        personaId,
        persona: json(persona),
        sessionId: s.id,
        discoveryPath: json(path),
        assessmentId: null,
        evaluationNotes: JSON.stringify({
          status: "insufficient_evidence_or_invalid_input",
          failure,
        }),
        approvalStatus: "not_reusable",
      },
    });
    logger.info("simulation.incomplete", {
      sessionId: s.id,
      runId: run.id,
      code: error.code,
    });
    return {
      ...run,
      report: null,
      passed: false,
      failure,
      readiness: evaluateReadiness(answersOf(s), evidenceOf(s), statesOf(s)),
    };
  }
}

// Clear the conversational epoch, retaining immutable records and confirmed knowledge.
export async function clearConversation(
  id: string,
  adminId: string,
  revision: number,
) {
  await db.$transaction(async (tx) => {
    await lock(tx, id, adminId, revision);
    await tx.conversationMessage.updateMany({
      where: { sessionId: id },
      data: { excludedFromContext: true, hiddenFromTranscript: true },
    });
    await tx.conversationSummary.updateMany({
      where: { sessionId: id },
      data: { superseded: true },
    });
    await tx.evidence.updateMany({
      where: { sessionId: id, status: "inferred", active: true },
      data: { active: false },
    });
    await tx.planActionProposal.updateMany({
      where: { sessionId: id, status: "pending" },
      data: { status: "cancelled", decidedAt: new Date() },
    });
    await tx.discoverySession.update({
      where: { id },
      data: { revision: { increment: 1 } },
    });
    await persistPlan(tx, id);
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "conversation.cleared",
        entityId: id,
        details: json({
          history: "retained-excluded",
          confirmedFacts: "preserved",
        }),
      },
    });
  });
  return getSession(id, adminId);
}

export async function restartDiscovery(
  id: string,
  adminId: string,
  revision: number,
) {
  await db.$transaction(async (tx) => {
    const s = await lock(tx, id, adminId, revision);
    const guidedKeys = [
      ...new Set(
        s.evidence.filter((e) => e.source === "guided").map((e) => e.key),
      ),
    ];
    const keep = s.evidence.filter(
      (e) => e.active && e.status === "confirmed" && e.source !== "guided",
    );
    await tx.discoveryAnswer.deleteMany({ where: { sessionId: id } });
    await tx.evidence.updateMany({
      where: { sessionId: id, active: true, source: "guided" },
      data: { active: false, status: "superseded" },
    });
    // Chat-confirmed facts remain authoritative. Stage is deliberately reset so the journey can change.
    for (const e of keep.filter((e) => e.key !== "stage"))
      await tx.discoveryAnswer.create({
        data: {
          sessionId: id,
          questionId: e.key,
          value: e.value!,
          responseState: "answered",
        },
      });
    await tx.evidence.updateMany({
      where: { sessionId: id, key: "stage", active: true },
      data: { active: false, status: "superseded" },
    });
    await tx.conversationSummary.updateMany({
      where: { sessionId: id, superseded: false },
      data: { superseded: true },
    });
    await tx.discoverySession.update({
      where: { id },
      data: {
        revision: { increment: 1 },
        knowledgeRevision: { increment: 1 },
        planState: json(null),
        contextState: json(null),
      },
    });
    await persistPlan(tx, id);
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "discovery.restarted",
        entityId: id,
        details: json({ guidedKeys, preservedChatFacts: keep.length }),
      },
    });
  });
  return getSession(id, adminId);
}
