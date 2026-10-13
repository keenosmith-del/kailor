import { db } from "./db.js";
import type { Prisma } from "./generated/prisma/client.js";
import { AppError } from "./errors.js";
import {
  activeQuestions,
  nextQuestion,
  pruneAnswers,
  relevant,
  validateAnswer,
  version,
} from "./discovery.js";
import type { Answers, AnswerValue, Report } from "../../shared/src/index.js";
import { createReport } from "./assessment.js";
import {
  type CaseRecord,
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
  subject: true,
  answers: true,
  messages: { orderBy: { ordinal: "asc" as const } },
  evidence: { where: { active: true }, orderBy: { createdAt: "asc" as const } },
};
export const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export function answersOf(session: {
  answers: { questionId: string; value: unknown }[];
}): Answers {
  return Object.fromEntries(
    session.answers.map((a) => [a.questionId, a.value]),
  ) as Answers;
}
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
) {
  await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${id} FOR UPDATE`;
  const s = await tx.discoverySession.findFirst({
    where: { id, adminId },
    include,
  });
  if (!s) throw new AppError(404, "not_found", "Session not found");
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
) {
  return db.discoverySession.create({
    data: {
      admin: { connect: { id: adminId } },
      definitionVersion: version,
      synthetic,
      subject: { create: { name, synthetic } },
    },
    include,
  });
}
async function writeAnswer(
  tx: Prisma.TransactionClient,
  s: Awaited<ReturnType<typeof getSession>>,
  key: string,
  value: AnswerValue,
  skip: boolean,
  source: string,
) {
  const q = validateAnswer(key, value, skip);
  const previous = answersOf(s);
  if (!relevant(q, previous))
    throw new AppError(
      400,
      "irrelevant_question",
      "This question is not active in this pathway",
    );
  const next = pruneAnswers({ ...previous, [key]: skip ? "" : value });
  const removed = Object.keys(previous).filter((k) => !(k in next));
  if (removed.length)
    await tx.discoveryAnswer.deleteMany({
      where: { sessionId: s.id, questionId: { in: removed } },
    });
  await tx.evidence.updateMany({
    where: { sessionId: s.id, key: { in: [key, ...removed] }, active: true },
    data: { active: false },
  });
  await tx.discoveryAnswer.upsert({
    where: { sessionId_questionId: { sessionId: s.id, questionId: key } },
    create: {
      sessionId: s.id,
      questionId: key,
      value: json(skip ? "" : value),
      skipped: skip,
    },
    update: { value: json(skip ? "" : value), skipped: skip },
  });
  if (!skip)
    await tx.evidence.create({
      data: {
        sessionId: s.id,
        key,
        value: json(value),
        status: "confirmed",
        source,
      },
    });
  await tx.discoverySession.update({
    where: { id: s.id },
    data: { revision: { increment: 1 } },
  });
  await tx.auditEvent.create({
    data: {
      actorId: s.adminId,
      action: "answer.updated",
      entityId: s.id,
      details: json({ key, removed, source }),
    },
  });
}
export async function submitAnswer(
  id: string,
  adminId: string,
  input: {
    revision: number;
    questionId: string;
    value: AnswerValue;
    skip?: boolean;
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
      );
    });
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (
      e instanceof Error &&
      [
        "Unknown question",
        "Enter a response",
        "Choose a valid option",
        "Choose valid, non-conflicting options",
        "This question is required",
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
) {
  await db.$transaction(async (tx) => {
    const s = await lock(tx, id, adminId, revision);
    const e = s.evidence.find(
      (e) => e.id === evidenceId && e.status === "inferred",
    );
    if (!e) throw new AppError(404, "not_found", "Pending proposal not found");
    if (accept)
      await writeAnswer(
        tx,
        s,
        e.key,
        e.value as AnswerValue,
        false,
        "chat-confirmed",
      );
    else {
      await tx.evidence.update({
        where: { id: e.id },
        data: { active: false, status: "rejected" },
      });
      await tx.discoverySession.update({
        where: { id },
        data: { revision: { increment: 1 } },
      });
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
  input: { revision: number; message: string; mode: string },
  forceMock = false,
) {
  const s = await getSession(id, adminId);
  if (s.revision !== input.revision)
    throw new AppError(409, "revision_conflict", "Refresh the changed session");
  let provider = new MockProvider() as import("./ai.js").AiProvider;
  let reason: string | null = null;
  const reservation =
    !forceMock && remoteEnabled(config)
      ? await reserveUsage(id, input.mode)
      : null;
  if (reservation)
    provider = new CloudflareProvider({
      account: config.CLOUDFLARE_ACCOUNT_ID,
      token: config.CLOUDFLARE_API_TOKEN,
      model: config.CLOUDFLARE_MODEL,
      maxTokens: config.AI_MAX_OUTPUT_TOKENS,
      timeoutMs: config.AI_TIMEOUT_MS,
    });
  else
    reason = remoteEnabled(config)
      ? "budget_exhausted_or_simulation"
      : "remote_disabled";
  const result = await inferSafely(
    provider,
    answersOf(s),
    input.message,
    s.messages,
    input.mode,
  );
  if (reservation)
    await db.aiUsageRecord.update({
      where: { id: reservation.id },
      data: {
        status: result.fallbackReason ? "failed" : "completed",
        reason: result.fallbackReason,
      },
    });
  await db.$transaction(async (tx) => {
    await lock(tx, id, adminId, input.revision);
    await tx.conversationMessage.createMany({
      data: [
        {
          sessionId: id,
          role: "user",
          ordinal: s.revision * 2,
          content: input.message,
          provider: "user",
        },
        {
          sessionId: id,
          role: "assistant",
          ordinal: s.revision * 2 + 1,
          content: result.output.reply,
          provider: result.provider,
        },
      ],
    });
    for (const p of result.output.proposals)
      await tx.evidence.create({
        data: {
          sessionId: id,
          key: p.key,
          value: json(p.value),
          status: "inferred",
          source: result.provider,
        },
      });
    await tx.discoverySession.update({
      where: { id },
      data: { revision: { increment: 1 } },
    });
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "conversation.created",
        entityId: id,
        details: json({
          provider: result.provider,
          fallbackReason: result.fallbackReason ?? reason,
        }),
      },
    });
  });
  return {
    session: await getSession(id, adminId),
    provider: result.provider,
    fallbackReason: result.fallbackReason ?? reason,
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
export async function nextForSession(id: string, adminId: string) {
  const s = await getSession(id, adminId),
    a = answersOf(s),
    matches = matchCases(a, await referenceCases(adminId));
  return {
    question: nextQuestion(a),
    active: activeQuestions(a),
    answered: s.answers.length,
    total: activeQuestions(a).length,
    referenceHints: matches.flatMap((m) =>
      (m.pattern.discoveryQuestions ?? []).slice(0, 1).map((question) => ({
        question,
        source: m.title,
        reason: m.reasons[0],
      })),
    ),
  };
}
export async function assess(id: string, adminId: string, revision: number) {
  const cases = await referenceCases(adminId);
  const result = await db.$transaction(async (tx) => {
    const s = await lock(tx, id, adminId, revision);
    const existing = await tx.assessment.findUnique({
      where: {
        sessionId_sessionRevision: { sessionId: id, sessionRevision: revision },
      },
      include: { report: true },
    });
    if (existing) return existing;
    const a = answersOf(s);
    if (!a.industry || !a.problems || !a.goals)
      throw new AppError(
        422,
        "insufficient_evidence",
        "Confirm your context, challenges and goals before assessment",
      );
    const content = createReport(a, revision, s.synthetic, cases, {
      currency: config.ESTIMATE_CURRENCY,
      hourlyRate: config.ESTIMATE_HOURLY_RATE,
    });
    const assessment = await tx.assessment.create({
      data: {
        sessionId: id,
        sessionRevision: revision,
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
    stale: report.assessment.sessionRevision !== s.revision,
  };
}
export async function canvas(id: string, adminId: string) {
  const s = await getSession(id, adminId);
  const content = createReport(
    answersOf(s),
    s.revision,
    s.synthetic,
    await referenceCases(adminId),
  );
  return {
    revision: s.revision,
    existing: (answersOf(s).presence ?? []) as string[],
    components: content.recommendations.map((r) => ({
      id: r.serviceId,
      title: r.solution,
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
    note: "Proposed components from current confirmed evidence. No implementation is implied.",
  };
}
export async function simulate(adminId: string, personaId: string) {
  const persona = personas.find((p) => p.id === personaId);
  if (!persona) throw new AppError(404, "persona_missing", "Persona not found");
  let s = await createSession(adminId, persona.name, true);
  const path: string[] = [];
  let q = nextQuestion(answersOf(s));
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
    path.push(q.id);
    q = nextQuestion(answersOf(s));
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
    await tx.caseIntelligenceRecord.create({
      data: {
        sourceType: "simulation",
        sourceRunId: run.id,
        title: `Synthetic reference: ${persona.name}`,
        pattern: json({
          industry: String(a.industry ?? ""),
          problems: a.problems ?? [],
          tools: [],
          goals: [],
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
}
