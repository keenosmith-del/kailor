import { beforeAll, afterAll, it, expect, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import {
  createSession,
  getSession,
  converse,
  confirmBatch,
  assess,
  getReport,
  canvas,
  submitAnswer,
  reserveUsage,
  answersOf,
} from "../src/session-service.js";
import { readPersonalMemory } from "../src/personal-memory.js";
import {
  createPlan,
  selectPlan,
  newDiscovery,
  understanding,
} from "../src/plan-service.js";
import { CloudflareProvider } from "../src/ai.js";
import { services } from "../../data/services.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use isolated _test database");
const a = request.agent(app),
  b = request.agent(app),
  guest = request.agent(app);
let owner: string, other: string;
const prefix = `plans-${randomUUID()}`;
beforeAll(async () => {
  for (const [client, label] of [
    [a, "a"],
    [b, "b"],
  ] as const) {
    const email = `${prefix}-${label}@kailor.local`,
      password = "plan-test-password";
    const account = await db.adminUser.create({
      data: { email, passwordHash: await hashPassword(password) },
    });
    if (label === "a") owner = account.id;
    else other = account.id;
    expect(
      (
        await client
          .post("/api/auth/login")
          .set("Origin", config.APP_ORIGIN)
          .send({ email, password })
      ).status,
    ).toBe(200);
  }
  for (const s of services)
    await db.service.upsert({ where: { id: s.id }, create: s, update: s });
});
afterAll(async () => {
  const owners = [owner, other].filter(Boolean);
  const subjects = await db.discoverySession.findMany({
    where: { adminId: { in: owners } },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: { in: owners } } });
  await db.subject.deleteMany({
    where: { id: { in: subjects.map((s) => s.subjectId) } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: owners } } });
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
async function plan(title: string) {
  const response = await a
    .post("/api/plans")
    .set("Origin", config.APP_ORIGIN)
    .send({ title, creationKey: randomUUID() });
  expect(response.status).toBe(201);
  return response.body;
}
async function chat(sessionId: string, message: string, confirm = false) {
  let s = await getSession(sessionId, owner);
  s = (
    await converse(
      s.id,
      owner,
      { revision: s.revision, message, mode: "conversation" },
      true,
    )
  ).session;
  const proposals = s.evidence.filter(
    (e) => e.status === "inferred" && e.active,
  );
  if (confirm && proposals.length)
    s = await confirmBatch(
      s.id,
      owner,
      s.revision,
      proposals.map((e) => e.id),
      true,
    );
  return s;
}
it("creates idempotently, renames with optimistic revisions, archives without loss and restores", async () => {
  const key = randomUUID(),
    input = { title: "Nail technician business", creationKey: key };
  const both = await Promise.all([
    a.post("/api/plans").set("Origin", config.APP_ORIGIN).send(input),
    a.post("/api/plans").set("Origin", config.APP_ORIGIN).send(input),
  ]);
  expect(both.map((r) => r.status)).toEqual([201, 201]);
  expect(both[0].body.id).toBe(both[1].body.id);
  const p = both[0].body;
  expect(await db.discoverySession.count({ where: { planId: p.id } })).toBe(1);
  expect(
    (
      await a
        .post("/api/plans")
        .set("Origin", config.APP_ORIGIN)
        .send({ ...input, title: "Different request" })
    ).status,
  ).toBe(409);
  const renamed = await a
    .patch(`/api/plans/${p.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send({ revision: 0, title: "Nail studio" });
  expect(renamed.status).toBe(200);
  expect(
    (
      await a
        .patch(`/api/plans/${p.id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0, title: "Stale" })
    ).status,
  ).toBe(409);
  const s = await chat(
    p.lastSessionId,
    "I run a nail business and use WhatsApp for manual bookings.",
    true,
  );
  const archived = await a
    .patch(`/api/plans/${p.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send({ revision: 1, archived: true });
  expect(archived.status).toBe(200);
  expect((await a.get(`/api/sessions/${s.id}`)).body.messages).toHaveLength(2);
  expect(
    (
      await a
        .post(`/api/sessions/${s.id}/chat`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: s.revision, message: "Hi." })
    ).status,
  ).toBe(409);
  expect(
    (
      await a
        .post(`/api/plans/${p.id}/select`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0 })
    ).status,
  ).toBe(409);
  expect(
    (await a.get("/api/plans?archived=true")).body.plans.some(
      (x: any) => x.id === p.id,
    ),
  ).toBe(true);
  expect(
    (
      await a
        .patch(`/api/plans/${p.id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 2, archived: false })
    ).status,
  ).toBe(200);
  expect(
    (await getSession(s.id, owner)).messages.map((m) => m.content),
  ).toEqual(s.messages.map((m) => m.content));
});
it("serializes selection, resumes selected older discovery and retains both independent sessions", async () => {
  const p = await plan("Selection test"),
    q = await plan("Second selection");
  const initial = (await a.get("/api/plans")).body.selection.revision;
  const switches = await Promise.all(
    [p, q].map((x) =>
      a
        .post(`/api/plans/${x.id}/select`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: initial }),
    ),
  );
  expect(switches.map((r) => r.status).sort()).toEqual([200, 409]);
  const fresh = await newDiscovery(p.id, owner, 0, randomUUID());
  const before = (await a.get("/api/plans")).body.selection.revision;
  await selectPlan(p.id, owner, before, p.lastSessionId);
  const reloaded = (await a.get("/api/plans")).body;
  expect(reloaded.selection.activePlanId).toBe(p.id);
  expect(reloaded.plans.find((x: any) => x.id === p.id).lastSessionId).toBe(
    p.lastSessionId,
  );
  expect(
    (await a.get(`/api/plans/${p.id}/sessions`)).body.sessions.map(
      (s: any) => s.id,
    ),
  ).toEqual(expect.arrayContaining([fresh.sessionId, p.lastSessionId]));
  const creationKey = randomUUID();
  const current = (await db.plan.findUniqueOrThrow({ where: { id: p.id } }))
    .revision;
  const first = await newDiscovery(p.id, owner, current, creationKey),
    retry = await newDiscovery(p.id, owner, current, creationKey);
  expect(first).toEqual(retry);
});
it("keeps budgets, evidence, reports, revisions and model payloads isolated across two plans", async () => {
  const nail = await plan("Nail business"),
    print = await plan("T-shirt printing business");
  let n = await chat(
    nail.lastSessionId,
    "I run a nail business and take manual bookings through WhatsApp.",
    true,
  );
  n = await chat(
    n.id,
    "I want a portfolio and easier bookings. My budget is R2,000.",
    true,
  );
  let p = await chat(
    print.lastSessionId,
    "I run a t-shirt printing business. I want customers to order printed shirts with their own designs. My budget is R40,000.",
    true,
  );
  expect(answersOf(n).budget).toContain("R2,000");
  expect(answersOf(p).budget).toContain("R40,000");
  const nr = await assess(n.id, owner, n.revision),
    pr = await assess(p.id, owner, p.revision);
  expect(JSON.stringify(nr)).not.toContain("R40,000");
  expect(JSON.stringify(pr)).not.toContain("WhatsApp");
  const turn = await converse(
    p.id,
    owner,
    {
      revision: p.revision,
      message: "What budget did I give you?",
      mode: "conversation",
    },
    true,
  );
  expect(turn.session.messages.at(-1)?.content).toContain("R40,000");
  expect(turn.session.messages.at(-1)?.content).not.toContain("R2,000");
  p = await chat(
    p.id,
    "I want customers to upload artwork before paying.",
    true,
  );
  expect((await getReport(n.id, owner)).stale).toBe(false);
  expect((await getReport(n.id, owner)).content).toEqual(nr.content);
  expect((await canvas(n.id, owner)).source).toBe("snapshot");
  const compare = await a
    .post("/api/plans/compare")
    .set("Origin", config.APP_ORIGIN)
    .send({ planIds: [nail.id, print.id] });
  expect(compare.status).toBe(200);
  expect(compare.body.plans.map((x: any) => x.title)).toEqual([
    "Nail business",
    "T-shirt printing business",
  ]);
  expect(JSON.stringify(compare.body.plans[0])).not.toContain("R40,000");
  const after = await getSession(n.id, owner);
  expect(after.knowledgeRevision).toBe(n.knowledgeRevision);
  let sent = "";
  const provider = new CloudflareProvider(
    {
      account: "test",
      token: "test",
      model: "test",
      maxTokens: 300,
      timeoutMs: 100,
    },
    async (_url, init) => {
      sent = String(init?.body);
      return new Response(
        JSON.stringify({
          result: {
            response: JSON.stringify({
              reply: "An existing catalogue is an option to investigate.",
              proposals: [],
            }),
          },
        }),
      );
    },
  );
  await provider.infer(
    answersOf(p),
    "Explain my options",
    p.messages.filter((m) => !m.excludedFromContext),
    "conversation",
    {
      plan: await (
        await import("../src/session-service.js")
      ).nextForSession(p.id, owner),
      memory: await readPersonalMemory(p, "options"),
    },
  );
  expect(sent).not.toContain("Nail business");
  expect(sent).not.toContain("R2,000");
  expect(sent).not.toContain(n.id);
  expect(sent).toContain(print.id);
  const history = (await a.get(`/api/plans/${nail.id}/reports`)).body.reports;
  expect(history).toHaveLength(1);
  expect(
    (await a.get(`/api/plans/${nail.id}/reports/${history[0].id}`)).body
      .content,
  ).toEqual(nr.content);
});
it("proposes another business without adding its facts, and creates only on an explicit idempotent decision", async () => {
  const p = await plan("Original salon");
  let s = await chat(
    p.lastSessionId,
    "I run a salon and use WhatsApp for bookings.",
    true,
  );
  const revision = s.knowledgeRevision,
    answers = answersOf(s),
    count = await db.plan.count({ where: { adminId: owner } });
  s = await chat(s.id, "I'm also starting a t-shirt printing business.");
  expect(answersOf(s)).toEqual(answers);
  expect(s.knowledgeRevision).toBe(revision);
  expect(s.planProposals).toHaveLength(1);
  expect(await db.plan.count({ where: { adminId: owner } })).toBe(count);
  expect(s.messages.slice(-2).every((m) => m.excludedFromContext)).toBe(true);
  const proposal = s.planProposals[0],
    body = { revision: s.revision, decision: "create" };
  const response = await a
    .post(`/api/sessions/${s.id}/plan-proposals/${proposal.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send(body);
  expect(response.status).toBe(200);
  expect(response.body.plan.title).toContain("t-shirt printing");
  const retry = await a
    .post(`/api/sessions/${s.id}/plan-proposals/${proposal.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send(body);
  expect(retry.body.plan.id).toBe(response.body.plan.id);
  expect(await db.plan.count({ where: { adminId: owner } })).toBe(count + 1);
  expect(
    (await getSession(response.body.plan.lastSessionId, owner)).evidence,
  ).toHaveLength(0);
  expect(JSON.stringify(await readPersonalMemory(s, "earlier"))).not.toContain(
    "t-shirt",
  );
  s = await chat(
    s.id,
    "I want a website, easier invoices, and customer reminders for my salon.",
  );
  expect(s.planProposals).toHaveLength(0);
});
it("keeps cancel/current decisions distinct, rejects stale decisions and never creates an ambiguous business automatically", async () => {
  const p = await plan("Action review");
  let s = await chat(p.lastSessionId, "Could this be another business?");
  const proposal = s.planProposals[0];
  expect(proposal).toBeTruthy();
  expect(
    (
      await a
        .post(`/api/sessions/${s.id}/plan-proposals/${proposal.id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: s.revision - 1, decision: "create" })
    ).status,
  ).toBe(409);
  const count = await db.plan.count({ where: { adminId: owner } });
  expect(
    (
      await a
        .post(`/api/sessions/${s.id}/plan-proposals/${proposal.id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: s.revision, decision: "cancel" })
    ).status,
  ).toBe(200);
  expect(await db.plan.count({ where: { adminId: owner } })).toBe(count);
  s = await chat(s.id, "I also run a delivery business.");
  expect(
    (
      await a
        .post(`/api/sessions/${s.id}/plan-proposals/${s.planProposals[0].id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: s.revision, decision: "continue_current" })
    ).status,
  ).toBe(200);
});
it("persists versioned older memory, retrieves distant options, avoids load-time refresh and invalidates corrections", async () => {
  const p = await plan("Long-history inspection plan");
  let s = await chat(
    p.lastSessionId,
    "I already have a website. I have decided I want a portfolio for my work.",
    true,
  );
  s = await chat(s.id, "Would I need a website or an app?");
  const optionId = s.messages.at(-1)!.id;
  const originalWebsiteMessage = s.messages[0].id;
  for (let i = 0; i < 18; i++)
    s = await chat(s.id, i % 2 ? "Thanks." : "Could you explain that?");
  const summaries = await db.conversationSummary.findMany({
    where: { sessionId: s.id },
    orderBy: { version: "asc" },
  });
  expect(summaries.length).toBeGreaterThan(0);
  expect(summaries.at(-1)?.sourceRevision).toBeLessThanOrEqual(s.revision);
  const memory = await readPersonalMemory(s, "What about the second option?");
  expect(
    memory.summary?.entries.some((e) => e.sourceMessageId === optionId),
  ).toBe(true);
  expect(memory.retrieved.some((m) => m.id === optionId)).toBe(true);
  const reply = await converse(
    s.id,
    owner,
    {
      revision: s.revision,
      message: "What about the second option?",
      mode: "conversation",
    },
    true,
  );
  s = reply.session;
  expect(s.messages.at(-1)?.content).toContain("mobile application");
  const versions = await db.conversationSummary.count({
    where: { sessionId: s.id },
  });
  await understanding(p.id, owner);
  await understanding(p.id, owner);
  expect(
    await db.conversationSummary.count({ where: { sessionId: s.id } }),
  ).toBe(versions);
  const oldRevision = s.knowledgeRevision;
  s = await chat(s.id, "Actually, I shut down that website last month.", true);
  expect(answersOf(s).websiteStatus).toBe("absent");
  expect(s.knowledgeRevision).toBeGreaterThan(oldRevision);
  expect((await readPersonalMemory(s, "website")).summary).toBeUndefined();
  expect(
    await db.conversationSummary.count({
      where: { sessionId: s.id, superseded: false },
    }),
  ).toBe(0);
  s = await chat(s.id, "Where were we?");
  expect(
    (await readPersonalMemory(s, "website")).summary?.knowledgeRevision,
  ).toBe(s.knowledgeRevision);
  expect(answersOf(await getSession(s.id, owner)).websiteStatus).toBe("absent");
  expect(
    (await readPersonalMemory(s, "website")).summary?.entries.find(
      (e) => e.sourceMessageId === originalWebsiteMessage,
    )?.temporal,
  ).toBe("superseded");
});
it("saves only explicitly reviewed account defaults, clears them and never globalizes a plan budget", async () => {
  expect((await a.get("/api/preferences")).body).toEqual([]);
  const response = await a
    .put("/api/preferences")
    .set("Origin", config.APP_ORIGIN)
    .send({ revision: 0, key: "communicationStyle", value: "plain-language" });
  expect(response.status).toBe(200);
  const p = await plan("Preferences plan"),
    s = await getSession(p.lastSessionId, owner);
  expect((await readPersonalMemory(s, "explain")).preferences).toEqual([
    { key: "communicationStyle", value: "plain-language", revision: 0 },
  ]);
  expect((await b.get("/api/preferences")).body).toEqual([]);
  expect(
    (
      await a
        .put("/api/preferences")
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0, key: "budget", value: "R2000" })
    ).status,
  ).toBe(400);
  expect(
    (
      await a
        .put("/api/preferences")
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0, key: "communicationStyle", value: null })
    ).status,
  ).toBe(200);
  expect((await readPersonalMemory(s, "explain")).preferences).toEqual([]);
  expect(
    (
      await a.put("/api/preferences").set("Origin", config.APP_ORIGIN).send({
        revision: 0,
        key: "communicationStyle",
        value: "technical-detail",
      })
    ).status,
  ).toBe(409);
});
it("rejects every other-account plan/session/report/evidence/PDF and comparison request including archived plans", async () => {
  const p = await plan("Private owner boundary");
  let s = await chat(
    p.lastSessionId,
    "I run a nail business and want a portfolio website for my work.",
    true,
  );
  const report = await assess(s.id, owner, s.revision);
  const paths = [
    `/api/plans/${p.id}`,
    `/api/plans/${p.id}/understanding`,
    `/api/plans/${p.id}/sessions`,
    `/api/plans/${p.id}/reports`,
    `/api/plans/${p.id}/reports/${report.reportId}`,
    `/api/sessions/${s.id}`,
    `/api/sessions/${s.id}/next`,
    `/api/sessions/${s.id}/report`,
    `/api/sessions/${s.id}/report.pdf`,
    `/api/sessions/${s.id}/canvas`,
  ];
  for (const path of paths) expect((await b.get(path)).status, path).toBe(404);
  expect(
    (
      await b
        .patch(`/api/plans/${p.id}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0, title: "Stolen" })
    ).status,
  ).toBe(404);
  expect(
    (
      await b
        .post(`/api/plans/${p.id}/select`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0 })
    ).status,
  ).toBe(404);
  expect(
    (
      await b
        .post(`/api/sessions/${s.id}/evidence/${randomUUID()}`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: s.revision, accept: true })
    ).status,
  ).toBe(404);
  expect(
    (
      await b
        .post(`/api/plans/${p.id}/sessions`)
        .set("Origin", config.APP_ORIGIN)
        .send({ revision: 0, creationKey: randomUUID() })
    ).status,
  ).toBe(404);
  const q = await createPlan(other, {
    title: "Other account",
    description: "",
    creationKey: randomUUID(),
  });
  await expect(
    readPersonalMemory({ ...s, id: q.lastSessionId! }, "earlier"),
  ).rejects.toMatchObject({ status: 404 });
  expect(
    (
      await b
        .post("/api/plans/compare")
        .set("Origin", config.APP_ORIGIN)
        .send({ planIds: [q.id, p.id] })
    ).status,
  ).toBe(404);
  await a
    .patch(`/api/plans/${p.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send({ revision: 0, archived: true });
  expect((await b.get(`/api/plans/${p.id}`)).status).toBe(404);
  await guest
    .post("/api/guest/sessions")
    .set("Origin", config.APP_ORIGIN)
    .send({});
  const listing = await guest.get("/api/guest/plans");
  expect(listing.status).toBe(200);
  expect(JSON.stringify(listing.body)).not.toContain(p.id);
  expect((await guest.get(`/api/guest/plans/${p.id}`)).status).toBe(404);
  expect((await guest.get("/api/plans")).status).toBe(401);
});
it("enforces the shared daily inference budget across plans", async () => {
  const one = await plan("Budget one"),
    two = await plan("Budget two");
  const daily = config.AI_MAX_CALLS_PER_DAY,
    session = config.AI_MAX_CALLS_PER_SESSION;
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const existing = await db.aiUsageRecord.count({
    where: { provider: "cloudflare", createdAt: { gte: midnight } },
  });
  try {
    config.AI_MAX_CALLS_PER_DAY = existing + 1;
    config.AI_MAX_CALLS_PER_SESSION = 5;
    expect(
      await reserveUsage(one.lastSessionId, "conversation"),
    ).not.toBeNull();
    expect(await reserveUsage(two.lastSessionId, "conversation")).toBeNull();
  } finally {
    config.AI_MAX_CALLS_PER_DAY = daily;
    config.AI_MAX_CALLS_PER_SESSION = session;
  }
});

it("rejects invalid edited facts without mutating a proposal or its revision", async () => {
  const p = await plan("Edited input validation");
  const s = await chat(p.lastSessionId, "I already have a website.");
  const evidence = s.evidence.find(
    (e) => e.key === "websiteStatus" && e.status === "inferred",
  )!;
  const invalid = await a
    .post(`/api/sessions/${s.id}/evidence/${evidence.id}`)
    .set("Origin", config.APP_ORIGIN)
    .send({ revision: s.revision, accept: true, value: "invalid option" });
  expect(invalid.status).toBe(400);
  expect((await getSession(s.id, owner)).revision).toBe(s.revision);
  expect(
    (await getSession(s.id, owner)).evidence.find((e) => e.id === evidence.id)
      ?.status,
  ).toBe("inferred");
});

it("keeps a successfully saved conversation when context retrieval or summary refresh fails", async () => {
  const p = await plan("Memory recovery");
  let s = await getSession(p.lastSessionId, owner);
  const retrieval = vi
    .spyOn(db.conversationSummary, "findFirst")
    .mockRejectedValueOnce(new Error("test context unavailable"));
  try {
    s = (
      await converse(
        s.id,
        owner,
        { revision: s.revision, message: "Hi.", mode: "conversation" },
        true,
      )
    ).session;
    expect(s.messages).toHaveLength(2);
  } finally {
    retrieval.mockRestore();
  }
  const memoryModule = await import("../src/personal-memory.js");
  const refresh = vi
    .spyOn(memoryModule, "updateConversationMemory")
    .mockRejectedValueOnce(new Error("test summary unavailable"));
  try {
    s = (
      await converse(
        s.id,
        owner,
        { revision: s.revision, message: "Thanks.", mode: "conversation" },
        true,
      )
    ).session;
    expect(s.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(s.knowledgeRevision).toBe(0);
  } finally {
    refresh.mockRestore();
  }
});
