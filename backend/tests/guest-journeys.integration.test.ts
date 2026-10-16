import { beforeAll, afterAll, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { getSession, submitAnswer, assess } from "../src/session-service.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use isolated _test database");
const origin = config.APP_ORIGIN,
  owners: string[] = [],
  client = request.agent(app),
  outsider = request.agent(app),
  account = request.agent(app);
let guestId: string,
  oldPlan: string,
  oldSession: string,
  freshPlan: string,
  freshSession: string,
  reportId: string,
  accountPlan: string;
let expiry: number;
const email = `journeys-${randomUUID()}@test.local`,
  password = "journey-testing-password";
let input: {
  planId: string;
  revision: number;
  creationKey: string;
  consent: true;
};
beforeAll(async () => {
  const user = await db.adminUser.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  owners.push(user.id);
  await account
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password })
    .expect(200);
  accountPlan = (
    await account
      .post("/api/plans")
      .set("Origin", origin)
      .send({ title: "Account project", creationKey: randomUUID() })
      .expect(201)
  ).body.id;
  const r = await client
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  guestId = r.body.adminId;
  oldSession = r.body.id;
  oldPlan = r.body.planId;
  owners.push(guestId);
  await db.plan.update({
    where: { id: oldPlan },
    data: { title: "Nail tech" },
  });
  let s = await getSession(oldSession, guestId);
  for (const [questionId, value] of [
    ["stage", "uncertain"],
    ["motivation", "I don’t know yet."],
    ["interests", "I don’t know yet."],
    ["opportunityStyle", "explore"],
  ])
    s = await submitAnswer(oldSession, guestId, {
      revision: s.revision,
      questionId,
      value,
      ...(["motivation", "interests"].includes(questionId)
        ? { responseState: "unknown" as const }
        : {}),
    });
  reportId = (await assess(oldSession, guestId, s.revision)).reportId;
  await db.projectSource.create({
    data: {
      planId: oldPlan,
      kind: "note",
      title: "Old project secret",
      content: "Only the archived project",
      status: "ready",
    },
  });
  await client
    .put("/api/guest/preferences")
    .set("Origin", origin)
    .send({ revision: 0, key: "communicationStyle", value: "plain-language" })
    .expect(200);
  expiry = (
    await db.authSession.findFirstOrThrow({ where: { adminId: guestId } })
  ).expiresAt.getTime();
  input = {
    planId: oldPlan,
    revision: (await db.plan.findUniqueOrThrow({ where: { id: oldPlan } }))
      .revision,
    creationKey: randomUUID(),
    consent: true,
  };
});
afterAll(async () => {
  const sessions = await db.discoverySession.findMany({
    where: { adminId: { in: owners } },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: { in: owners } } });
  await db.subject.deleteMany({
    where: { id: { in: sessions.map((s) => s.subjectId) } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: owners } } });
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("reads entry without creation or renewal and leaves cancellation entirely read-only", async () => {
  const before = await db.plan.count({ where: { adminId: guestId } });
  const empty = await outsider.get("/api/guest/journeys").expect(200);
  expect(empty.body).toEqual({ current: null, expiresAt: null });
  expect(empty.headers["set-cookie"]).toBeUndefined();
  for (let i = 0; i < 2; i++) {
    const r = await client.get("/api/guest/journeys").expect(200);
    expect(r.body.current.id).toBe(oldPlan);
    expect(r.body.current.title).toBe("Nail tech");
    expect(new Date(r.body.expiresAt).getTime()).toBe(expiry);
  }
  expect(await db.plan.count({ where: { adminId: guestId } })).toBe(before);
  expect(
    (await getSession(oldSession, guestId)).answers.length,
  ).toBeGreaterThan(0);
});
it("requires guest credentials, consent and an owned current project; account projects remain intact", async () => {
  await outsider
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send(input)
    .expect(401);
  await account
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, planId: accountPlan })
    .expect(401);
  await client
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, consent: false })
    .expect(400);
  await client
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, planId: accountPlan })
    .expect(404);
  await client
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, revision: input.revision + 1 })
    .expect(409);
  expect(
    (await account.get(`/api/plans/${accountPlan}`).expect(200)).body
      .archivedAt,
  ).toBeNull();
});
it("archives atomically with idempotent concurrent confirmation and one empty active project", async () => {
  const responses = await Promise.all(
    [0, 1].map(() =>
      client
        .post("/api/guest/journeys")
        .set("Origin", origin)
        .send(input)
        .expect(201),
    ),
  );
  expect(responses[0].body).toEqual(responses[1].body);
  freshPlan = responses[0].body.planId;
  freshSession = responses[0].body.sessionId;
  expect(freshPlan).not.toBe(oldPlan);
  expect(freshSession).not.toBe(oldSession);
  const s = await getSession(freshSession, guestId);
  expect(s.answers).toEqual([]);
  expect(s.messages).toEqual([]);
  expect(s.evidence).toEqual([]);
  expect(s.planProposals).toEqual([]);
  const preferences = await client.get("/api/guest/preferences").expect(200);
  expect(
    preferences.body.some(
      (preference: any) => preference.value === "plain-language",
    ),
  ).toBe(true);
  expect(s.revision).toBe(0);
  expect(s.knowledgeRevision).toBe(0);
  expect(s.contextState).toBeNull();
  expect(s.planState).toBeNull();
  expect(
    await db.assessment.count({ where: { sessionId: freshSession } }),
  ).toBe(0);
  expect(await db.projectSource.count({ where: { planId: freshPlan } })).toBe(
    0,
  );
  const active = await db.plan.findMany({
    where: { adminId: guestId, archivedAt: null },
  });
  expect(active).toHaveLength(1);
  expect(active[0].lastSessionId).toBe(freshSession);
  expect(
    (
      await db.accountSettings.findUniqueOrThrow({
        where: { adminId: guestId },
      })
    ).activePlanId,
  ).toBe(freshPlan);
  expect(
    (
      await db.authSession.findFirstOrThrow({ where: { adminId: guestId } })
    ).expiresAt.getTime(),
  ).toBe(expiry);
  expect(responses[0].headers["set-cookie"]).toBeUndefined();
});
it("retains archived answers, sources, immutable report and working PDF without crossing project boundaries", async () => {
  expect(
    (await getSession(oldSession, guestId)).answers.length,
  ).toBeGreaterThan(0);
  expect(
    (
      await client.get("/api/guest/plans?archived=true").expect(200)
    ).body.plans.map((p: any) => p.id),
  ).toContain(oldPlan);
  expect(
    (await client.get(`/api/guest/plans/${oldPlan}/sources`).expect(200)).body
      .sources[0].title,
  ).toBe("Old project secret");
  await client
    .get(`/api/guest/plans/${oldPlan}/reports/${reportId}`)
    .expect(200);
  const pdf = await client
    .get(`/api/guest/plans/${oldPlan}/reports/${reportId}/pdf`)
    .expect(200);
  expect(pdf.headers["content-type"]).toContain("application/pdf");
  await client
    .get(`/api/guest/plans/${freshPlan}/reports/${reportId}`)
    .expect(404);
  await account.get(`/api/plans/${freshPlan}`).expect(404);
  expect(
    (await client.get("/api/guest/journeys").expect(200)).body.current.id,
  ).toBe(freshPlan);
  expect(
    (
      await client
        .post("/api/guest/sessions")
        .set("Origin", origin)
        .send({})
        .expect(201)
    ).body.id,
  ).toBe(freshSession);
});
it("rejects archived mutations, stale confirmations and restoring a second active guest project", async () => {
  const old = await db.plan.findUniqueOrThrow({ where: { id: oldPlan } });
  await client
    .patch(`/api/guest/plans/${oldPlan}`)
    .set("Origin", origin)
    .send({ revision: old.revision, archived: false })
    .expect(409);
  await client
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, creationKey: randomUUID() })
    .expect(409);
  const s = await getSession(oldSession, guestId);
  await client
    .put(`/api/guest/sessions/${oldSession}/answers`)
    .set("Origin", origin)
    .send({ revision: s.revision, questionId: "stage", value: "established" })
    .expect(409);
  expect(
    await db.plan.count({ where: { adminId: guestId, archivedAt: null } }),
  ).toBe(1);
});
it("allows explicit transfer of a retained archived project and preserves account projects", async () => {
  await client
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password })
    .expect(200);
  await client
    .post("/api/guest/transfer")
    .set("Origin", origin)
    .send({ consent: true, planId: oldPlan, transferKey: randomUUID() })
    .expect(200);
  await account.get(`/api/plans/${oldPlan}/reports/${reportId}`).expect(200);
  await account.get(`/api/plans/${accountPlan}`).expect(200);
  await client.get(`/api/guest/sessions/${freshSession}`).expect(401);
});
it("never renews or replaces an expired guest with its old context", async () => {
  const agent = request.agent(app);
  const first = await agent
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(first.body.adminId);
  await db.authSession.updateMany({
    where: { adminId: first.body.adminId },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  expect(
    (await agent.get("/api/guest/journeys").expect(200)).body.current,
  ).toBeNull();
  await agent
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({ ...input, planId: first.body.planId })
    .expect(401);
});

it("explicit guest exit discards active and archived work without signing out or deleting account work", async () => {
  const agent = request.agent(app);
  const first = await agent
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  const adminId = first.body.adminId,
    planId = first.body.planId;
  owners.push(adminId);
  let s = await getSession(first.body.id, adminId);
  for (const [questionId, value] of [
    ["stage", "uncertain"],
    ["motivation", "I don’t know yet."],
    ["interests", "I don’t know yet."],
    ["opportunityStyle", "explore"],
  ])
    s = await submitAnswer(s.id, adminId, {
      revision: s.revision,
      questionId,
      value,
      ...(["motivation", "interests"].includes(questionId)
        ? { responseState: "unknown" as const }
        : {}),
    });
  const report = await assess(s.id, adminId, s.revision);
  await db.projectSource.create({
    data: {
      planId,
      kind: "note",
      title: "Temporary note",
      content: "Discard this guest note",
      status: "ready",
    },
  });
  const plan = await db.plan.findUniqueOrThrow({ where: { id: planId } });
  const fresh = await agent
    .post("/api/guest/journeys")
    .set("Origin", origin)
    .send({
      planId,
      revision: plan.revision,
      creationKey: randomUUID(),
      consent: true,
    })
    .expect(201);
  const subjects = await db.discoverySession.findMany({
    where: { adminId },
    select: { subjectId: true },
  });
  await agent
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password })
    .expect(200);
  await agent
    .post("/api/guest/logout")
    .set("Origin", origin)
    .send({ discard: false })
    .expect(400);
  await agent.get(`/api/guest/sessions/${fresh.body.sessionId}`).expect(200);
  const exit = await agent
    .post("/api/guest/logout")
    .set("Origin", origin)
    .send({ discard: true })
    .expect(200);
  expect(exit.body.discardedSessionIds.sort()).toEqual(
    [s.id, fresh.body.sessionId].sort(),
  );
  expect(String(exit.headers["set-cookie"])).toContain("kailor_guest=");
  expect(String(exit.headers["set-cookie"])).not.toContain("kailor_session=");
  expect(await db.adminUser.findUnique({ where: { id: adminId } })).toBeNull();
  expect(await db.plan.count({ where: { adminId } })).toBe(0);
  expect(await db.discoverySession.count({ where: { adminId } })).toBe(0);
  expect(
    await db.subject.count({
      where: { id: { in: subjects.map((s) => s.subjectId) } },
    }),
  ).toBe(0);
  expect(
    await db.reportSnapshot.findUnique({ where: { id: report.reportId } }),
  ).toBeNull();
  expect(await db.projectSource.count({ where: { planId } })).toBe(0);
  expect(await db.auditEvent.count({ where: { actorId: adminId } })).toBe(0);
  expect(await db.authSession.count({ where: { adminId } })).toBe(0);
  await agent.get(`/api/guest/sessions/${fresh.body.sessionId}`).expect(401);
  expect((await agent.get("/api/auth/me").expect(200)).body.email).toBe(email);
  await agent.get(`/api/plans/${accountPlan}`).expect(200);
  await agent.get(`/api/plans/${oldPlan}/reports/${reportId}`).expect(200);
  await agent
    .post("/api/guest/logout")
    .set("Origin", origin)
    .send({ discard: true })
    .expect(200);
  const next = await agent
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(next.body.adminId);
  expect(next.body.adminId).not.toBe(adminId);
  expect(next.body.answers).toEqual([]);
});
