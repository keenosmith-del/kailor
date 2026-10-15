import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { mkdir, writeFile } from "node:fs/promises";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { services } from "../../data/services.js";
import {
  createSession,
  submitAnswer,
  converse,
  assess,
  getReport,
  canvas,
  nextForSession,
  confirmBatch,
  simulate,
  referenceCases,
  answersOf,
} from "../src/session-service.js";
import {
  learningPattern,
  learningEvaluation,
} from "../src/intelligence-evaluation.js";
import { questions } from "../src/discovery.js";
import { personas } from "../src/library.js";
import type { Answers } from "../../shared/src/index.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw new Error("Use isolated _test database");
const client = request.agent(app);
let owner: string;
const email = `contextual-${Date.now()}@kailor.local`,
  password = "contextual-test-password";
beforeAll(async () => {
  owner = (
    await db.adminUser.create({
      data: {
        role: "admin",
        email,
        passwordHash: await hashPassword(password),
      },
    })
  ).id;
  for (const s of services)
    await db.service.upsert({ where: { id: s.id }, create: s, update: s });
  expect(
    (
      await client
        .post("/api/auth/login")
        .set("Origin", config.APP_ORIGIN)
        .send({ email, password })
    ).status,
  ).toBe(200);
});
afterAll(async () => {
  await db.caseIntelligenceRecord.deleteMany({
    where: { sourceRun: { session: { adminId: owner } } },
  });
  const sessions = await db.discoverySession.findMany({
    where: { adminId: owner },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: owner } });
  await db.subject.deleteMany({
    where: { id: { in: sessions.map((s) => s.subjectId) } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: owner } });
  await db.adminUser.delete({ where: { id: owner } });
  await db.$disconnect();
});
async function initial(a: Answers) {
  let s = await createSession(owner, "Iteration 005 synthetic QA", true);
  for (const [questionId, value] of Object.entries(a).sort(
    ([a], [b]) =>
      questions.findIndex((q) => q.id === a) -
      questions.findIndex((q) => q.id === b),
  ))
    s = await submitAnswer(s.id, owner, {
      revision: s.revision,
      questionId,
      value,
    });
  return s;
}
const valid = {
  stage: "established",
  industry: "Independent consultant",
  invoiceDetails: "I manually copy approved job totals into invoices each week",
  goals: "Reduce duplicate invoice entry",
  problems: ["invoices"],
};
describe("contextual PostgreSQL acceptance", () => {
  it("no-op chat saves ordered messages without stale reports or duplicate assessments", async () => {
    let s = await initial(valid);
    const old = await assess(s.id, owner, s.revision),
      knowledge = s.knowledgeRevision;
    for (const message of [
      "Hi.",
      "Thanks, that makes sense.",
      "Can I keep using my current software?",
    ])
      s = (
        await converse(
          s.id,
          owner,
          { revision: s.revision, message, mode: "conversation" },
          true,
        )
      ).session;
    expect(s.messages).toHaveLength(6);
    expect(s.messages.map((m) => m.ordinal)).toEqual(
      [...s.messages.map((m) => m.ordinal)].sort((a, b) => a - b),
    );
    expect(s.knowledgeRevision).toBe(knowledge);
    expect(s.evidence.filter((e) => e.status === "inferred")).toEqual([]);
    expect((await getReport(s.id, owner)).stale).toBe(false);
    expect((await canvas(s.id, owner)).source).toBe("snapshot");
    expect((await assess(s.id, owner, s.revision)).reportId).toBe(old.reportId);
    expect(await db.assessment.count({ where: { sessionId: s.id } })).toBe(1);
  });
  it("confirmed meaningful correction invalidates assessment while preserving its content", async () => {
    let s = await initial(valid);
    const old = await assess(s.id, owner, s.revision);
    s = (
      await converse(
        s.id,
        owner,
        {
          revision: s.revision,
          message: "I do not want automation anymore.",
          mode: "conversation",
        },
        true,
      )
    ).session;
    const proposal = s.evidence.find(
      (e) => e.key === "automationPreference" && e.status === "inferred",
    );
    expect(proposal).toBeTruthy();
    expect((await getReport(s.id, owner)).stale).toBe(false);
    s = await confirmBatch(s.id, owner, s.revision, [proposal!.id], true);
    const current = await getReport(s.id, owner);
    expect(current.stale).toBe(true);
    expect(current.content).toEqual(old.content);
    expect(
      (await canvas(s.id, owner)).components.some((c) => c.id === "automation"),
    ).toBe(false);
  });
  it("answer resubmission and proposal rejection leave knowledge revision unchanged", async () => {
    let s = await initial(valid);
    const old = await assess(s.id, owner, s.revision),
      k = s.knowledgeRevision;
    s = await submitAnswer(s.id, owner, {
      revision: s.revision,
      questionId: "goals",
      value: valid.goals,
    });
    expect(s.knowledgeRevision).toBe(k);
    s = (
      await converse(
        s.id,
        owner,
        {
          revision: s.revision,
          message: "I want a website for my consultancy portfolio.",
          mode: "conversation",
        },
        true,
      )
    ).session;
    s = await confirmBatch(
      s.id,
      owner,
      s.revision,
      s.evidence.filter((e) => e.status === "inferred").map((e) => e.id),
      false,
    );
    expect(s.knowledgeRevision).toBe(k);
    expect((await getReport(s.id, owner)).stale).toBe(false);
    expect((await assess(s.id, owner, s.revision)).reportId).toBe(old.reportId);
  });
  it("concurrent no-op chat still enforces the session lock", async () => {
    const s = await initial(valid);
    const results = await Promise.allSettled(
      ["Hi.", "Thanks."].map((message) =>
        converse(
          s.id,
          owner,
          { revision: s.revision, message, mode: "conversation" },
          true,
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult;
    expect(failed.reason.code).toBe("revision_conflict");
  });
  it("legacy definition sessions refresh projections without resetting answers or reports", async () => {
    const s = await initial(valid),
      old = await assess(s.id, owner, s.revision);
    await db.discoverySession.update({
      where: { id: s.id },
      data: {
        contextState: null as any,
        planState: { revision: s.revision, plannerVersion: "reliability-2" },
      },
    });
    const plan = await nextForSession(s.id, owner);
    expect(plan.plannerVersion).toBe("consulting-5");
    expect(plan.provenance.definitionVersion).toBe("1.0.0");
    expect((await getReport(s.id, owner)).content).toEqual(old.content);
  });
  it("offline requirements are persisted, navigable and skippable without repetition", async () => {
    let s = await initial({
      stage: "specific",
      request:
        "I inspect agricultural machinery and want technicians to record service work from phones without internet",
    });
    const first = await nextForSession(s.id, owner);
    expect(first.question?.id).toBe("offlineDetails");
    expect(await nextForSession(s.id, owner)).toEqual(first);
    s = await submitAnswer(s.id, owner, {
      revision: s.revision,
      questionId: "offlineDetails",
      value: "",
      skip: true,
    });
    expect(
      (await nextForSession(s.id, owner)).ranking.some(
        (r) => r.id === "offlineDetails",
      ),
    ).toBe(false);
    const report = await assess(s.id, owner, s.revision);
    expect(report.content.recommendations.map((r) => r.serviceId)).toEqual([
      "integration",
    ]);
    expect(report.content.recommendations[0].dependencies.join(" ")).toContain(
      "synchronization",
    );
  });
  it("natural app correction stays pending until confirmed, then shared views use new scope", async () => {
    let s = await initial({
      stage: "specific",
      request:
        "I want a mobile application for customers to upload project images",
    });
    const old = await assess(s.id, owner, s.revision),
      k = s.knowledgeRevision;
    s = (
      await converse(
        s.id,
        owner,
        {
          revision: s.revision,
          message: "Actually, I think a simple website might be enough.",
          mode: "conversation",
        },
        true,
      )
    ).session;
    expect(s.evidence.filter((e) => e.status === "inferred")).toEqual([]);
    expect(s.knowledgeRevision).toBe(k);
    expect((await getReport(s.id, owner)).stale).toBe(false);
    s = (
      await converse(
        s.id,
        owner,
        {
          revision: s.revision,
          message:
            "I don't need an app anymore. I want a website for my portfolio.",
          mode: "conversation",
        },
        true,
      )
    ).session;
    const ids = s.evidence
      .filter((e) => e.status === "inferred")
      .map((e) => e.id);
    expect(ids.length).toBeGreaterThan(0);
    s = await confirmBatch(s.id, owner, s.revision, ids, true);
    const revised = await assess(s.id, owner, s.revision);
    expect(
      revised.content.recommendations.map((r) => r.serviceId),
    ).not.toContain("webapp");
    expect(revised.content.recommendations.map((r) => r.serviceId)).toContain(
      "portfolio",
    );
    expect(
      (await db.reportSnapshot.findUnique({ where: { id: old.reportId } }))
        ?.content,
    ).toEqual(old.content);
    expect(
      (await nextForSession(s.id, owner)).context.facts.some(
        (f) => f.key === "appPreference" && f.value === "declined",
      ),
    ).toBe(true);
  });
  it("authorized model follow-up is validated and persisted at the locked revision without changing facts", async () => {
    let s = await initial({
      stage: "specific",
      request:
        "I inspect machinery and need staff to record service work offline from phones",
    });
    const old = await assess(s.id, owner, s.revision),
      knowledge = s.knowledgeRevision;
    const original = {
      AI_PROVIDER: config.AI_PROVIDER,
      AI_ALLOW_REMOTE: config.AI_ALLOW_REMOTE,
      CLOUDFLARE_ACCOUNT_ID: config.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: config.CLOUDFLARE_API_TOKEN,
    };
    const previousFetch = globalThis.fetch;
    let calls = 0;
    try {
      Object.assign(config, {
        AI_PROVIDER: "cloudflare",
        AI_ALLOW_REMOTE: "true",
        CLOUDFLARE_ACCOUNT_ID: "contract-test",
        CLOUDFLARE_API_TOKEN: "contract-test",
      });
      globalThis.fetch = async () => {
        calls++;
        return new Response(
          JSON.stringify({
            result: {
              response: JSON.stringify({
                reply: "Let us clarify offline work.",
                proposals: [],
                followUp: {
                  questionId: "offlineDetails",
                  title: "Which service tasks must work offline?",
                  hint: "Describe local records and synchronization after reconnection.",
                },
              }),
            },
          }),
          { status: 200 },
        );
      };
      const result = await converse(s.id, owner, {
        revision: s.revision,
        message: "Ask me a useful follow-up question",
        mode: "conversation",
      });
      expect(result.provider).toBe("cloudflare");
      s = result.session;
      expect(calls).toBe(1);
      const plan = await nextForSession(s.id, owner);
      expect(plan.question?.title).toBe(
        "Which service tasks must work offline?",
      );
      expect(plan.provenance.generation?.sourceRevision).toBe(s.revision - 1);
      expect(plan.questionHistory?.at(-1)?.source).toBe("cloudflare");
      expect(plan.provenance.generation?.validation).toBe("passed");
      expect(await nextForSession(s.id, owner)).toEqual(plan);
      expect(s.knowledgeRevision).toBe(knowledge);
      expect((await getReport(s.id, owner)).reportId).toBe(old.reportId);
      expect((await getReport(s.id, owner)).stale).toBe(false);
    } finally {
      Object.assign(config, original);
      globalThis.fetch = previousFetch;
    }
  });
  it("founder-approved nail pattern changes a related case and preserves review/version source history", async () => {
    const persona = {
      ...personas[0],
      synthetic: true as const,
      id: "iteration005-nail-booking",
      answers: {
        ...personas[0].answers,
        problems: ["credibility", "booking"],
        industry:
          "I am an independent nail technician. I use Instagram and take appointments through WhatsApp.",
        bookingDetails: "Manual WhatsApp bookings cause missed reminders",
        goals: "I want professional presentation and easier appointments",
        constraints: "Limited budget; start with a simple provider",
      },
      expectedServices: ["website", "booking"],
      excludedServices: ["webapp", "ai"],
    };
    const run = await simulate(owner, persona.id, persona);
    expect(run.passed).toBe(true);
    expect(run.report).toBeTruthy();
    const item = await db.caseIntelligenceRecord.findFirstOrThrow({
      where: { sourceRunId: run.id },
    });
    const review = await client
      .put(`/api/simulations/${run.id}/evaluation`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        notes:
          "Corrected unsupported assumption: online presentation does not imply a missing website in later clients.",
        omissions: ["Check existing provider capabilities"],
        incorrectAssumptions: ["Blindly reusing a website recommendation"],
        verdict: "needs_revision",
      });
    expect(review.status).toBe(200);
    const response = await client
      .put(`/api/cases/${item.id}/review`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        status: "approved",
        title: learningPattern.title,
        notes:
          "Sanitized synthetic pattern. Outcomes unverified; check current tools and permissions.",
        pattern: learningPattern.pattern,
      });
    expect(response.status).toBe(200);
    expect(response.body.sourceType).toBe("simulation");
    expect(response.body.sourceRunId).toBe(run.id);
    expect(response.body.reviewVersion).toBe(1);
    const detail = await client.get(`/api/simulations/${run.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.report).toEqual(run.report);
    const staleReview = await client
      .put(`/api/cases/${item.id}/review`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        status: "approved",
        title: learningPattern.title,
        reviewVersion: 0,
        notes: "Outdated review must be rejected without losing any version.",
        pattern: learningPattern.pattern,
      });
    expect(staleReview.status).toBe(409);
    const sensitiveReview = await client
      .put(`/api/cases/${item.id}/review`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        status: "approved",
        title: learningPattern.title,
        reviewVersion: 1,
        notes: "Sanitize before approval.",
        pattern: {
          ...learningPattern.pattern,
          limitations: ["patient name: Synthetic Identifier"],
        },
      });
    expect(sensitiveReview.status).toBe(422);
    expect(sensitiveReview.body.error.code).toBe("case_sensitive_data");
    const ref = (await referenceCases(owner)).find((c) => c.id === item.id)!;
    const evaluation = learningEvaluation(ref);
    expect(evaluation.result).toBe("improved");
    let related = await initial(evaluation.scenario as Answers);
    const relatedPlan = await nextForSession(related.id, owner);
    expect(relatedPlan.question?.id).toBe("bookingCapabilities");
    const saved = await assess(related.id, owner, related.revision);
    expect(saved.content.recommendations.map((r) => r.serviceId)).not.toContain(
      "website",
    );
    const update = await client
      .put(`/api/cases/${item.id}/review`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        status: "approved",
        title: learningPattern.title,
        notes:
          "Second review preserves earlier approved source and unverified outcome status.",
        pattern: {
          ...learningPattern.pattern,
          limitations: [
            "Synthetic outcomes remain unverified; second approved version",
          ],
        },
      });
    expect(update.status).toBe(200);
    expect(update.body.reviewVersion).toBe(2);
    const history = await db.auditEvent.findMany({
      where: { entityId: item.id, action: "case.review-history" },
    });
    expect(
      history.some(
        (e) =>
          (e.details as any).version === 1 &&
          (e.details as any).reviewStatus === "approved",
      ),
    ).toBe(true);
    expect((await getReport(related.id, owner)).content).toEqual(saved.content);
    expect((await getReport(related.id, owner)).stale).toBe(false);
    const pdf = await client.get(`/api/sessions/${related.id}/report.pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    await mkdir("../.cache/qa/iteration005", { recursive: true });
    await writeFile(
      "../.cache/qa/iteration005/learning-api.json",
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          sourceRunId: run.id,
          approvedCaseId: item.id,
          sourceType: response.body.sourceType,
          reviewVersion: response.body.reviewVersion,
          evaluation,
          historyPreserved: true,
          immutableReport: true,
        },
        null,
        2,
      ),
    );
    // Unapprove this test reference before other suites continue; historical report stays unchanged.
    await client
      .put(`/api/cases/${item.id}/review`)
      .set("Origin", config.APP_ORIGIN)
      .send({
        status: "rejected",
        title: learningPattern.title,
        notes:
          "Evaluation finished. Retire this temporary synthetic reference.",
        pattern: learningPattern.pattern,
      });
    expect((await referenceCases(owner)).some((c) => c.id === item.id)).toBe(
      false,
    );
  });
});

// Fresh session, no guided answers: exercise the same persisted assessment pipeline.
it("iteration 006 completes nail-business discovery through chat, edits evidence, preserves no-op freshness and exports PDF", async () => {
  let s = await createSession(owner, "Iteration 006 chat-only synthetic", true);
  for (const message of [
    "I run a small nail business on my own. I advertise on Instagram and take bookings through WhatsApp.",
    "I want to look more professional and make bookings easier, but I don't want an expensive application.",
  ]) {
    s = (
      await converse(
        s.id,
        owner,
        { revision: s.revision, message, mode: "conversation" },
        true,
      )
    ).session;
    const pending = s.evidence.filter(
      (e) => e.active && e.status === "inferred",
    );
    expect(pending.length).toBeGreaterThan(0);
    expect((await nextForSession(s.id, owner)).readiness.canAssess).toBe(false);
    s = await confirmBatch(
      s.id,
      owner,
      s.revision,
      pending.map((e) => e.id),
      true,
    );
  }
  expect(s.answers.some((a) => a.questionId === "stage")).toBe(false);
  expect(answersOf(s).tools).toContain("WhatsApp");
  expect((await nextForSession(s.id, owner)).readiness.canAssess).toBe(true);
  const old = await assess(s.id, owner, s.revision);
  expect(
    old.content.recommendations.some((r) =>
      ["website", "portfolio", "booking"].includes(r.serviceId),
    ),
  ).toBe(true);
  expect(old.content.recommendations.every((r) => r.evidence.length > 0)).toBe(
    true,
  );
  for (const message of [
    "Thanks.",
    "Can you explain the first recommendation?",
  ]) {
    s = (
      await converse(
        s.id,
        owner,
        { revision: s.revision, message, mode: "conversation" },
        true,
      )
    ).session;
    expect((await getReport(s.id, owner)).stale).toBe(false);
  }
  expect((await canvas(s.id, owner)).source).toBe("snapshot");
  const pdf = await client.get(`/api/sessions/${s.id}/report.pdf`);
  expect(pdf.status).toBe(200);
  expect(pdf.headers["content-type"]).toContain("application/pdf");
  // Real HTTP edit validates, confirms and updates shared knowledge in one transaction.
  s = (
    await converse(
      s.id,
      owner,
      {
        revision: s.revision,
        message: "I want a website for my photography work.",
        mode: "conversation",
      },
      true,
    )
  ).session;
  const proposal = s.evidence.find(
    (e) => e.active && e.status === "inferred" && e.key === "goals",
  );
  expect(proposal).toBeTruthy();
  const edited = await client
    .post(`/api/sessions/${s.id}/evidence/${proposal!.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send({
      revision: s.revision,
      accept: true,
      value: "I want a portfolio website for my nail designs and bookings",
    });
  expect(edited.status).toBe(200);
  expect(answersOf(edited.body).goals).toBe(
    "I want a portfolio website for my nail designs and bookings",
  );
  expect((await getReport(s.id, owner)).stale).toBe(true);
  expect((await getReport(s.id, owner)).content).toEqual(old.content);
});

it("iteration 006 keeps concurrent chat ordering and rejects stale retries without duplicate messages", async () => {
  const s = await createSession(owner, "Iteration 006 concurrent chat", true);
  const results = await Promise.allSettled(
    ["Hi.", "How are you?"].map((message) =>
      converse(
        s.id,
        owner,
        { revision: s.revision, message, mode: "conversation" },
        true,
      ),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const saved = await db.conversationMessage.findMany({
    where: { sessionId: s.id },
    orderBy: { ordinal: "asc" },
  });
  expect(saved.map((m) => m.role)).toEqual(["user", "assistant"]);
  await expect(
    converse(
      s.id,
      owner,
      { revision: s.revision, message: "Hi.", mode: "conversation" },
      true,
    ),
  ).rejects.toMatchObject({ status: 409 });
  expect(
    await db.conversationMessage.count({ where: { sessionId: s.id } }),
  ).toBe(2);
});

it("iteration 006 confirms the exact website change-of-mind without retaining mobile scope", async () => {
  let s = await createSession(owner, "Iteration 006 change of mind", true);
  s = (
    await converse(
      s.id,
      owner,
      {
        revision: s.revision,
        message: "I want a mobile application for my business.",
        mode: "conversation",
      },
      true,
    )
  ).session;
  s = await confirmBatch(
    s.id,
    owner,
    s.revision,
    s.evidence
      .filter((e) => e.active && e.status === "inferred")
      .map((e) => e.id),
    true,
  );
  // App preference alone is insufficient; supply a real situation and useful outcome through chat.
  expect((await nextForSession(s.id, owner)).readiness.canAssess).toBe(false);
  s = (
    await converse(
      s.id,
      owner,
      {
        revision: s.revision,
        message:
          "I run a small photography studio. I want customers to browse my work and send enquiries.",
        mode: "conversation",
      },
      true,
    )
  ).session;
  s = await confirmBatch(
    s.id,
    owner,
    s.revision,
    s.evidence
      .filter((e) => e.active && e.status === "inferred")
      .map((e) => e.id),
    true,
  );
  const old = await assess(s.id, owner, s.revision);
  s = (
    await converse(
      s.id,
      owner,
      {
        revision: s.revision,
        message: "Actually, I think a website would be enough.",
        mode: "conversation",
      },
      true,
    )
  ).session;
  expect(answersOf(s).appPreference).toBe("requested");
  const proposed = s.evidence.filter(
    (e) => e.active && e.status === "inferred",
  );
  expect(
    proposed.some((e) => e.key === "appPreference" && e.value === "declined"),
  ).toBe(true);
  s = await confirmBatch(
    s.id,
    owner,
    s.revision,
    proposed.map((e) => e.id),
    true,
  );
  expect(answersOf(s).appPreference).toBe("declined");
  expect((await getReport(s.id, owner)).stale).toBe(true);
  expect((await getReport(s.id, owner)).content).toEqual(old.content);
  expect(
    (await canvas(s.id, owner)).components.some((c) => c.id === "mobile"),
  ).toBe(false);
});
