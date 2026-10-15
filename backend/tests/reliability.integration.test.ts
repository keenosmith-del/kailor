import { beforeAll, afterAll, afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { db } from "../src/db.js";
import { app } from "../src/app.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { services } from "../../data/services.js";
import { reliabilityCases } from "../../data/evaluations/reliability.js";
import { evaluateInput, usableAnswers } from "../src/input-quality.js";
import {
  createSession,
  submitAnswer,
  converse,
  nextForSession,
  assess,
  answersOf,
  statesOf,
  confirmBatch,
  getReport,
  canvas,
  simulate,
  json,
} from "../src/session-service.js";
import { AppError } from "../src/errors.js";
import type {
  AnswerValue,
  Evidence,
  InputQuality,
} from "../../shared/src/index.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw new Error(
    "Reliability integration tests require the documented isolated _test database",
  );
let adminId: string;
const email = `reliability-${Date.now()}@test.invalid`,
  password = "isolated-test-password",
  origin = config.APP_ORIGIN;
const client = request.agent(app),
  owners: string[] = [],
  records: unknown[] = [],
  executions: { name: string; passed: boolean; failureExplanation: string }[] =
    [];
afterEach((context) => {
  const result = context.task.result;
  executions.push({
    name: context.task.name,
    passed: result?.state === "pass",
    failureExplanation: (result?.errors ?? []).map((e) => e.message).join("; "),
  });
});
const record = (
  id: string,
  initialContext: unknown,
  input: unknown,
  expected: unknown,
  actual: unknown,
) =>
  records.push({
    id,
    initialContext,
    input,
    expected,
    actual,
    passed: true,
    failureExplanation: "",
  });
beforeAll(async () => {
  const owner = await db.adminUser.create({
    data: { role: "admin", email, passwordHash: await hashPassword(password) },
  });
  adminId = owner.id;
  owners.push(adminId);
  for (const service of services)
    await db.service.upsert({
      where: { id: service.id },
      create: service,
      update: service,
    });
  const r = await client
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password });
  expect(r.status).toBe(200);
});
afterAll(async () => {
  const directory = fileURLToPath(
    new URL("../../.cache/qa/iteration004", import.meta.url),
  );
  await mkdir(directory, { recursive: true });
  await writeFile(
    `${directory}/acceptance-api.json`,
    JSON.stringify(
      {
        policyVersion: "reliability-2",
        generatedAt: new Date().toISOString(),
        cases: records,
        executions,
        complete: executions.length === 69 && executions.every((e) => e.passed),
      },
      null,
      2,
    ),
  );
  for (const owner of owners) {
    const subjects = await db.discoverySession.findMany({
      where: { adminId: owner },
      select: { subjectId: true },
    });
    await db.caseIntelligenceRecord.deleteMany({
      where: { sourceRun: { session: { adminId: owner } } },
    });
    await db.discoverySession.deleteMany({ where: { adminId: owner } });
    await db.subject.deleteMany({
      where: { id: { in: subjects.map((s) => s.subjectId) } },
    });
    await db.auditEvent.deleteMany({ where: { actorId: owner } });
    await db.adminUser.delete({ where: { id: owner } });
  }
  await db.$disconnect();
});
async function initial(
  answers: Record<string, AnswerValue> = {
    stage: "established",
    industry: "Independent carpenter",
  },
) {
  let s = await createSession(adminId, "Synthetic reliability test", true);
  for (const [questionId, value] of Object.entries(answers))
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId,
      value,
    });
  return s;
}
async function runToExhaustion() {
  let s = await initial();
  const seen = new Set<string>();
  for (let count = 0; count < 35; count++) {
    const plan = await nextForSession(s.id, adminId),
      q = plan.question;
    if (!q) return s;
    expect(seen.has(q.id)).toBe(false);
    seen.add(q.id);
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId: q.id,
      value: q.optional
        ? ""
        : q.type === "multi"
          ? ["none"]
          : "I don't know yet.",
      ...(q.optional
        ? { skip: true }
        : {
            responseState:
              q.type === "text" ? ("unknown" as const) : ("answered" as const),
          }),
    });
  }
  throw new Error("Discovery did not exhaust its useful questions");
}
describe("persisted quality and readiness acceptance matrix", () => {
  it.each(reliabilityCases)("$id", async (c) => {
    let s = await initial(c.initial);
    const prior = s;
    let disposition: string, quality: InputQuality | undefined;
    try {
      if (c.mode === "chat") {
        const r = await converse(
          s.id,
          adminId,
          { revision: s.revision, message: c.input, mode: "conversation" },
          true,
        );
        s = r.session;
        quality = r.quality;
        disposition = quality.disposition;
      } else {
        s = await submitAnswer(s.id, adminId, {
          revision: s.revision,
          questionId: c.key,
          value: c.input,
          responseState: c.state,
          resolveConflicts: c.confirmCorrection,
        });
        quality = s.answers.find((a) => a.questionId === c.key)
          ?.quality as unknown as InputQuality;
        disposition = quality?.disposition ?? "accepted";
      }
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      const error = e as AppError;
      s = await db.discoverySession.findUniqueOrThrow({
        where: { id: s.id },
        include: {
          plan: true,
          planProposals: { where: { status: "pending" } },
          subject: true,
          answers: true,
          messages: true,
          evidence: { where: { active: true }, orderBy: { createdAt: "asc" } },
        },
      });
      quality = (error.details as { quality?: InputQuality })?.quality;
      disposition =
        error.code === "input_conflict"
          ? "conflict_detected"
          : (quality?.disposition ?? error.code);
      if (error.code !== "input_conflict") {
        expect(s.revision).toBe(prior.revision);
        expect(s.evidence.length).toBe(prior.evidence.length);
      }
    }
    expect(disposition).toBe(c.expected.disposition);
    const plan = await nextForSession(s.id, adminId);
    expect(plan.readiness.canAssess).toBe(c.expected.canAssess);
    const data = await canvas(s.id, adminId);
    expect(data.readiness).toEqual(plan.readiness);
    const ids = data.components.map((x) => x.id);
    for (const id of c.expected.services ?? []) expect(ids).toContain(id);
    for (const id of c.expected.excluded ?? []) expect(ids).not.toContain(id);
    if (plan.readiness.canAssess) {
      const report = await assess(s.id, adminId, s.revision);
      expect(report.content.recommendations.length).toBeGreaterThan(0);
      expect(report.content.recommendations.map((r) => r.serviceId)).toEqual(
        ids,
      );
    } else {
      await expect(assess(s.id, adminId, s.revision)).rejects.toMatchObject({
        code: "insufficient_evidence",
      });
      expect(data.components).toEqual([]);
      expect(await db.assessment.count({ where: { sessionId: s.id } })).toBe(0);
    }
    if (
      !c.expected.usable &&
      c.mode !== "chat" &&
      c.key &&
      !(c.key in c.initial)
    )
      expect(
        s.evidence.some((e) => e.key === c.key && e.status === "confirmed"),
      ).toBe(false);
    record(
      `persisted:${c.id}`,
      c.initial,
      c.input,
      {
        disposition: c.expected.disposition,
        confirmedEvidence: c.expected.usable
          ? "explicit useful input only"
          : "no new reliable fact",
        unknowns: c.expected.unknowns,
        readiness: c.expected.canAssess
          ? "qualified assessment available"
          : "needs information",
        assessmentPermitted: c.expected.canAssess,
        recommendationPermitted: c.expected.canAssess,
        recovery: c.expected.recovery,
      },
      {
        disposition,
        confirmedEvidence: usableAnswers(answersOf(s), statesOf(s)),
        unknowns: plan.readiness.uncertainties,
        readiness: plan.readiness.state,
        assessmentPermitted: plan.readiness.canAssess,
        recommendationPermitted: ids.length > 0,
        services: ids,
        recovery: quality?.recovery ?? "confirm_correction",
      },
    );
  });
});
describe("actual API recovery, conflicts, reports and authorization", () => {
  it("rejects placeholder input without advancing and accepts corrected activity without a solution", async () => {
    let s = await initial({ stage: "established" });
    const bad = await client
      .put(`/api/sessions/${s.id}/answers`)
      .set("Origin", origin)
      .send({
        revision: s.revision,
        questionId: "industry",
        value: "Lorem ipsum dolor sit amet.",
      });
    expect(bad.status).toBe(422);
    expect(bad.body.error.details.quality.disposition).toBe(
      "rejected_placeholder",
    );
    expect((await client.get(`/api/sessions/${s.id}`)).body.revision).toBe(
      s.revision,
    );
    const good = await client
      .put(`/api/sessions/${s.id}/answers`)
      .set("Origin", origin)
      .send({
        revision: s.revision,
        questionId: "industry",
        value: "I run a nail business.",
      });
    expect(good.status).toBe(200);
    s = good.body;
    const plan = (await client.get(`/api/sessions/${s.id}/next`)).body;
    expect(plan.readiness.canAssess).toBe(false);
    expect(plan.question).toBeTruthy();
    record(
      "api:invalid-input-recovery",
      { stage: "established" },
      ["Lorem ipsum", "I run a nail business"],
      {
        disposition: ["rejected_placeholder", "accepted"],
        assessmentPermitted: false,
        recovery: "correct_input",
      },
      {
        revision: s.revision,
        canAssess: plan.readiness.canAssess,
        nextQuestion: plan.question.id,
      },
    );
  });
  it("all-skipped discovery recovers through clarification without restarting the catalogue", async () => {
    let s = await runToExhaustion();
    const p = await nextForSession(s.id, adminId);
    expect(p.question).toBeNull();
    expect(p.completion.state).toBe("exhausted");
    expect(
      (
        await client
          .post(`/api/sessions/${s.id}/assessment`)
          .set("Origin", origin)
          .send({ revision: s.revision })
      ).status,
    ).toBe(422);
    expect((await client.get(`/api/sessions/${s.id}/report`)).status).toBe(404);
    const r = await client
      .put(`/api/sessions/${s.id}/answers`)
      .set("Origin", origin)
      .send({
        revision: s.revision,
        questionId: "clarification",
        value:
          "I manually prepare invoices for customers every week, and it takes several hours.",
      });
    expect(r.status).toBe(200);
    s = r.body;
    const updated = (await client.get(`/api/sessions/${s.id}/next`)).body;
    expect(updated.readiness.canAssess).toBe(true);
    expect(updated.question?.id).not.toBe("workflowDetails");
    const report = await client
      .post(`/api/sessions/${s.id}/assessment`)
      .set("Origin", origin)
      .send({ revision: s.revision });
    expect(report.status).toBe(200);
    expect(
      report.body.content.recommendations.map((r: any) => r.serviceId),
    ).toEqual(["automation"]);
    record(
      "api:exhausted-to-clarified",
      p.answerStates,
      "Concrete invoice clarification",
      {
        before: "exhausted",
        after: "preliminary_available",
        assessmentPermitted: true,
        recovery: "clarify",
      },
      {
        completion: updated.completion.state,
        services: report.body.content.recommendations.map(
          (r: any) => r.serviceId,
        ),
      },
    );
  });
  it("an incomplete session moves to conversation; unrelated turns do not contaminate its evidence", async () => {
    let s = await runToExhaustion();
    const id = s.id;
    for (const message of [
      "Hi.",
      "Write me a poem about the ocean.",
      "What's the weather tomorrow?",
    ]) {
      const r = await client
        .post(`/api/sessions/${id}/chat`)
        .set("Origin", origin)
        .send({ revision: s.revision, message });
      expect(r.status).toBe(200);
      s = r.body.session;
      expect(s.evidence.some((e) => e.status === "inferred")).toBe(false);
    }
    const r = await client
      .post(`/api/sessions/${id}/chat`)
      .set("Origin", origin)
      .send({
        revision: s.revision,
        message:
          "I manually prepare invoices every week in spreadsheets, and it takes several hours.",
      });
    s = r.body.session;
    const ids = s.evidence
      .filter((e) => e.status === "inferred")
      .map((e) => e.id);
    expect(ids.length).toBeGreaterThan(0);
    s = await confirmBatch(id, adminId, s.revision, ids, true);
    expect(s.id).toBe(id);
    expect((await nextForSession(id, adminId)).readiness.canAssess).toBe(true);
    expect(s.messages).toHaveLength(8);
    record(
      "api:conversation-handoff",
      { completion: "exhausted" },
      ["Hi", "Poem", "Weather", "Actual invoice workflow"],
      {
        noFactsFromOffTopic: true,
        assessmentPermitted: true,
        recovery: "clarify",
      },
      {
        confirmedKeys: s.evidence
          .filter((e) => e.status === "confirmed")
          .map((e) => e.key),
        sessionPreserved: s.id === id,
      },
    );
  });
  it("guided contradictions stay pending, block assessment and resolve only explicitly", async () => {
    let s = await initial({
      stage: "established",
      industry: "Professional photographer",
      goals: "I want a portfolio to show completed work",
      presence: ["website"],
      websiteStatus: "existing",
    });
    const old = await assess(s.id, adminId, s.revision);
    const conflict = await client
      .put(`/api/sessions/${s.id}/answers`)
      .set("Origin", origin)
      .send({
        revision: s.revision,
        questionId: "websiteStatus",
        value: "absent",
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("input_conflict");
    const before = (await client.get(`/api/sessions/${s.id}`)).body;
    expect(
      before.answers.find((a: any) => a.questionId === "websiteStatus").value,
    ).toBe("existing");
    expect(before.revision).toBe(s.revision + 1);
    const blocked = (await client.get(`/api/sessions/${s.id}/next`)).body;
    expect(blocked.conflicts.length).toBeGreaterThan(0);
    expect(blocked.readiness.canAssess).toBe(false);
    expect(
      (
        await client
          .post(`/api/sessions/${s.id}/assessment`)
          .set("Origin", origin)
          .send({ revision: before.revision })
      ).status,
    ).toBe(422);
    const accepted = await client
      .put(`/api/sessions/${s.id}/answers`)
      .set("Origin", origin)
      .send({
        revision: before.revision,
        questionId: "websiteStatus",
        value: "absent",
        resolveConflicts: true,
      });
    expect(accepted.status).toBe(200);
    s = accepted.body;
    const final = (await client.get(`/api/sessions/${s.id}/next`)).body;
    expect(final.conflicts).toEqual([]);
    expect(final.readiness.canAssess).toBe(true);
    const report = await assess(s.id, adminId, s.revision);
    expect(report.reportId).not.toBe(old.reportId);
    expect(
      (
        await db.reportSnapshot.findUniqueOrThrow({
          where: { id: old.reportId },
        })
      ).content,
    ).toEqual(old.content);
    record(
      "api:guided-correction-confirmed",
      { websiteStatus: "existing" },
      "absent",
      {
        disposition: "conflict_detected",
        confirmationRequired: true,
        oldSnapshotImmutable: true,
      },
      {
        conflicts: final.conflicts,
        readiness: final.readiness.state,
        oldSnapshotImmutable: true,
      },
    );
  });
  it("chat recognizes a closed website, keeps history and does not repeat a resolved conflict", async () => {
    let s = await initial({
      stage: "established",
      industry: "I run a business and already have a website.",
      goals: "I want a portfolio to show completed photography work",
      presence: ["website"],
    });
    const old = await assess(s.id, adminId, s.revision);
    const r = await converse(
      s.id,
      adminId,
      {
        revision: s.revision,
        message:
          "Actually, I closed that website last month. I only use Instagram now.",
        mode: "conversation",
      },
      true,
    );
    s = r.session;
    expect(
      r.session.evidence.some(
        (e) =>
          e.status === "inferred" && (e.provenance as any)?.conflicts.length,
      ),
    ).toBe(true);
    expect((await nextForSession(s.id, adminId)).readiness.canAssess).toBe(
      false,
    );
    s = await confirmBatch(
      s.id,
      adminId,
      s.revision,
      s.evidence.filter((e) => e.status === "inferred").map((e) => e.id),
      true,
    );
    const plan = await nextForSession(s.id, adminId);
    expect(plan.conflicts).toEqual([]);
    expect(
      plan.context.possibilities.find((x) => x.key === "websiteStatus")
        ?.value ?? answersOf(s).websiteStatus,
    ).toBe("absent");
    expect((await canvas(s.id, adminId)).existing).not.toContain("website");
    expect(
      await db.evidence.count({ where: { sessionId: s.id, active: false } }),
    ).toBeGreaterThan(0);
    expect(
      (
        await db.reportSnapshot.findUniqueOrThrow({
          where: { id: old.reportId },
        })
      ).content,
    ).toEqual(old.content);
    record(
      "api:closed-website-confirmed",
      { presence: ["website"] },
      "Closed website; Instagram now",
      {
        conflictsResolved: true,
        currentWebsite: false,
        historyPreserved: true,
      },
      {
        conflicts: plan.conflicts,
        currentChannels: (await canvas(s.id, adminId)).existing,
        historyPreserved: true,
      },
    );
  });
  it("invalidated evidence blocks new reports while the previous PDF remains immutable", async () => {
    let s = await initial({
      stage: "established",
      industry: "Independent carpenter",
      problems: ["invoices"],
      invoiceDetails: "I manually copy job records into invoices each week",
      goals: "Reduce duplicate entry",
    });
    const old = await assess(s.id, adminId, s.revision);
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId: "invoiceDetails",
      value: "Not applicable",
      responseState: "not_applicable",
    });
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId: "goals",
      value: "I don't know yet",
      responseState: "unknown",
    });
    expect((await nextForSession(s.id, adminId)).readiness.canAssess).toBe(
      false,
    );
    await expect(assess(s.id, adminId, s.revision)).rejects.toMatchObject({
      code: "insufficient_evidence",
    });
    expect((await canvas(s.id, adminId)).components).toEqual([]);
    const latest = await getReport(s.id, adminId);
    expect(latest.stale).toBe(true);
    expect(latest.content).toEqual(old.content);
    const pdf = await client.get(`/api/sessions/${s.id}/report.pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    record(
      "api:report-invalidated",
      { reportRevision: old.content.revision },
      "Workflow not applicable; goal unknown",
      {
        assessmentPermitted: false,
        oldSnapshotImmutable: true,
        recovery: "clarify",
      },
      { stale: latest.stale, components: [], pdfValid: true },
    );
  });
  it("simultaneous API edits serialize like two browser tabs", async () => {
    const s = await initial();
    const rs = await Promise.all(
      [
        "I want a portfolio to show completed work",
        "I want to reduce duplicate invoice entry",
      ].map((value) =>
        client
          .put(`/api/sessions/${s.id}/answers`)
          .set("Origin", origin)
          .send({ revision: s.revision, questionId: "goals", value }),
      ),
    );
    expect(rs.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(rs.find((r) => r.status === 409)?.body.error.code).toBe(
      "revision_conflict",
    );
    record(
      "api:concurrent-session-revisions",
      { revision: s.revision },
      "Two simultaneous edits",
      { accepted: 1, revisionConflicts: 1 },
      { statuses: rs.map((r) => r.status).sort() },
    );
  });
  it("branch changes preserve unrelated information and retire branch evidence", async () => {
    let s = await initial({
      stage: "starting",
      idea: "A new design studio",
      industry: "Independent designer",
      goals: "I want a portfolio to show my completed work",
    });
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId: "stage",
      value: "established",
    });
    expect(answersOf(s).idea).toBeUndefined();
    expect(answersOf(s).goals).toContain("portfolio");
    expect(
      await db.evidence.count({
        where: { sessionId: s.id, key: "idea", active: false },
      }),
    ).toBe(1);
    record(
      "api:branch-pruning",
      { stage: "starting", idea: "A design studio" },
      "established",
      { ideaRetired: true, goalRetained: true },
      { answers: answersOf(s), historyPreserved: true },
    );
  });
  it("invalid simulations are recorded internally without a reusable case or report", async () => {
    const run = await simulate(adminId, "invalid-persona", {
      id: "invalid-persona",
      name: "Synthetic invalid input",
      synthetic: true,
      description: "Internal failure fixture",
      answers: {
        stage: "established",
        industry: "Lorem ipsum dolor sit amet.",
      },
      chat: [],
      expectedServices: [],
      excludedServices: [],
    });
    expect(run.passed).toBe(false);
    expect(run.report).toBeNull();
    expect(run.assessmentId).toBeNull();
    expect(run.approvalStatus).toBe("not_reusable");
    expect(
      await db.caseIntelligenceRecord.count({ where: { sourceRunId: run.id } }),
    ).toBe(0);
    const injected = await db.caseIntelligenceRecord.create({
      data: {
        sourceType: "simulation",
        sourceRunId: run.id,
        title: "Invalid source pattern",
        pattern: json({
          industry: "cross-industry",
          problems: ["booking"],
          tools: [],
          goals: [],
          patterns: ["booking"],
        }),
      },
    });
    const review = await client
      .put(`/api/cases/${injected.id}/review`)
      .set("Origin", origin)
      .send({
        status: "approved",
        notes: "Founder review must still honor the evidence boundary",
        title: injected.title,
        pattern: injected.pattern,
      });
    expect(review.status).toBe(422);
    record(
      "api:invalid-case-learning",
      {},
      "Placeholder synthetic persona",
      { report: null, reusableCase: false, approvalPermitted: false },
      { report: run.report, caseGenerated: false, reviewStatus: review.status },
    );
  });
  it("restart creates a fresh session and retains exhausted history", async () => {
    const s = await runToExhaustion();
    const fresh = await client
      .post("/api/sessions")
      .set("Origin", origin)
      .send({ name: "Fresh synthetic discovery" });
    expect(fresh.status).toBe(201);
    expect(fresh.body.id).not.toBe(s.id);
    expect((await client.get(`/api/sessions/${s.id}`)).status).toBe(200);
    expect(fresh.body.answers).toEqual([]);
    record(
      "api:insufficient-restart",
      { completion: "exhausted" },
      "Start again",
      { freshIdentity: true, oldHistoryPreserved: true },
      { freshIdentity: fresh.body.id !== s.id, oldHistoryPreserved: true },
    );
  });
  it("guests cannot reach founder case approval or simulations", async () => {
    const guest = request.agent(app),
      g = await guest
        .post("/api/guest/sessions")
        .set("Origin", origin)
        .send({});
    expect(g.status).toBe(201);
    owners.push(g.body.adminId);
    const denied = await guest
      .post("/api/simulations")
      .set("Origin", origin)
      .send({ personaId: "nail-technician" });
    expect(denied.status).toBe(401);
    expect(
      (
        await guest
          .put("/api/cases/seed-nails/review")
          .set("Origin", origin)
          .send({})
      ).status,
    ).toBe(401);
    expect((await guest.get("/api/cases")).status).toBe(401);
    record(
      "api:guest-founder-isolation",
      { isGuest: true },
      "Approve cases or simulate",
      { authorized: false },
      { status: denied.status, privateDataExposed: false },
    );
  });
  it("sensitive founder context stays local even with remote opt-in", async () => {
    const s = await initial();
    const original = {
        AI_PROVIDER: config.AI_PROVIDER,
        AI_ALLOW_REMOTE: config.AI_ALLOW_REMOTE,
        CLOUDFLARE_ACCOUNT_ID: config.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN: config.CLOUDFLARE_API_TOKEN,
      },
      fetcher = globalThis.fetch;
    let calls = 0;
    try {
      Object.assign(config, {
        AI_PROVIDER: "cloudflare",
        AI_ALLOW_REMOTE: "true",
        CLOUDFLARE_ACCOUNT_ID: "test-only",
        CLOUDFLARE_API_TOKEN: "test-only",
      });
      globalThis.fetch = async () => {
        calls++;
        throw new Error("Unexpected outbound test call");
      };
      const result = await converse(s.id, adminId, {
        revision: s.revision,
        message:
          "I want a portfolio for my photography work. Contact private@example.com",
        mode: "conversation",
      });
      expect(calls).toBe(0);
      expect(result.fallbackReason).toBe("sensitive_context_kept_local");
      expect(await db.aiUsageRecord.count({ where: { sessionId: s.id } })).toBe(
        0,
      );
      record(
        "api:private-context-kept-local",
        {},
        "Synthetic private contact details",
        { remoteCalls: 0 },
        { remoteCalls: calls, fallback: result.fallbackReason },
      );
    } finally {
      Object.assign(config, original);
      globalThis.fetch = fetcher;
    }
  });
});
