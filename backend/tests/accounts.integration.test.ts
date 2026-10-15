import { afterAll, beforeAll, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword, tokenHash } from "../src/auth.js";
import {
  createSession,
  converse,
  clearConversation,
  submitAnswer,
  getSession,
  assess,
  getReport,
  confirmBatch,
} from "../src/session-service.js";
import { readPersonalMemory } from "../src/personal-memory.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use _test database");
const prefix = `accounts-${randomUUID()}`;
const email = `${prefix}@test.local`,
  password = "synthetic-password-only";
const founder = request.agent(app),
  member = request.agent(app);
let founderId: string, memberId: string, invite: string;
const origin = config.APP_ORIGIN;
const owners: string[] = [];
beforeAll(async () => {
  const a = await db.adminUser.create({
    data: {
      email: `${prefix}-founder@test.local`,
      passwordHash: await hashPassword(password),
      role: "admin",
    },
  });
  founderId = a.id;
  owners.push(a.id);
  await founder
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: a.email, password })
    .expect(200);
});
afterAll(async () => {
  const rows = await db.discoverySession.findMany({
    where: { adminId: { in: owners } },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: { in: owners } } });
  await db.subject.deleteMany({
    where: { id: { in: rows.map((r) => r.subjectId) } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: owners } } });
  await db.accountInvite.deleteMany({ where: { createdBy: founderId } });
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("rejects explicitly supplied invalid legacy invitations without revealing account existence", async () => {
  const r = await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email, password, invite: "invalid" });
  expect(r.status).toBe(400);
  expect(await db.adminUser.findUnique({ where: { email } })).toBeNull();
});
it("issues an email-bound single-use invitation from founder access only", async () => {
  await request(app)
    .post("/api/auth/invites")
    .set("Origin", origin)
    .send({ email })
    .expect(401);
  const r = await founder
    .post("/api/auth/invites")
    .set("Origin", origin)
    .send({ email })
    .expect(201);
  invite = r.body.invite;
  const stored = await db.accountInvite.findUniqueOrThrow({
    where: { tokenHash: tokenHash(invite) },
  });
  expect(stored.tokenHash).not.toBe(invite);
  await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: `wrong-${email}`, password, invite })
    .expect(400);
});
it("registers a member with normalized email and an HttpOnly session, never an administrator", async () => {
  const r = await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: email.toUpperCase(), password, invite })
    .expect(201);
  expect(r.body.role).toBe("member");
  expect(r.body.email).toBe(email);
  expect(r.headers["set-cookie"][0]).toContain("HttpOnly");
  memberId = (await db.adminUser.findUniqueOrThrow({ where: { email } })).id;
  owners.push(memberId);
  expect((await member.get("/api/auth/me")).body.role).toBe("member");
  await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email, password, invite })
    .expect(400);
});
it("protects every founder tool server-side and permits own plans", async () => {
  for (const endpoint of ["cases", "personas", "scenarios", "simulations"])
    await member.get(`/api/${endpoint}`).expect(403);
  await member
    .post("/api/simulations")
    .set("Origin", origin)
    .send({ personaId: "anything" })
    .expect(403);
  await member
    .put(`/api/cases/${randomUUID()}/review`)
    .set("Origin", origin)
    .send({})
    .expect(403);
  await member
    .post("/api/auth/invites")
    .set("Origin", origin)
    .send({ email })
    .expect(403);
  await member.get("/api/plans").expect(200);
  const s = await createSession(founderId, "Founder private plan", true);
  await member.get(`/api/sessions/${s.id}`).expect(404);
  await member
    .post(`/api/sessions/${s.id}/conversation/clear`)
    .set("Origin", origin)
    .send({ revision: 0 })
    .expect(404);
});
it("rejects expired invitations, weak passwords and cross-origin signup", async () => {
  const code = randomUUID();
  await db.accountInvite.create({
    data: {
      tokenHash: tokenHash(code),
      email: `${prefix}-expired@test.local`,
      expiresAt: new Date(0),
      createdBy: founderId,
    },
  });
  await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email: `${prefix}-expired@test.local`, password, invite: code })
    .expect(400);
  await member
    .post("/api/auth/register")
    .set("Origin", origin)
    .send({ email, password: "short", invite })
    .expect(400);
  await member
    .post("/api/auth/register")
    .set("Origin", "https://untrusted.example")
    .send({ email, password, invite })
    .expect(403);
});
it("clears context atomically while preserving confirmed facts, reports and history", async () => {
  let s = await createSession(memberId, "Synthetic reset workflow", true);
  s = (
    await converse(
      s.id,
      memberId,
      {
        revision: s.revision,
        message:
          "I run a nail business and want a portfolio website for my work.",
        mode: "conversation",
      },
      true,
    )
  ).session;
  s = await confirmBatch(
    s.id,
    memberId,
    s.revision,
    s.evidence
      .filter((e) => e.active && e.status === "inferred")
      .map((e) => e.id),
    true,
  );
  await assess(s.id, memberId, s.revision);
  const report = await getReport(s.id, memberId);
  s = (
    await converse(
      s.id,
      memberId,
      {
        revision: s.revision,
        message: "I use a paper diary to record customer orders",
        mode: "conversation",
      },
      true,
    )
  ).session;
  const facts = s.answers,
    kr = s.knowledgeRevision;
  const cleared = await clearConversation(s.id, memberId, s.revision);
  expect(cleared.messages.length).toBe(s.messages.length);
  expect(
    cleared.messages.every(
      (m) => m.hiddenFromTranscript && m.excludedFromContext,
    ),
  ).toBe(true);
  expect(cleared.answers).toEqual(facts);
  expect(cleared.knowledgeRevision).toBe(kr);
  expect(await getReport(s.id, memberId)).toEqual(report);
  expect(cleared.evidence.every((e) => e.status !== "inferred")).toBe(true);
  const memory = await readPersonalMemory(
    cleared,
    "What did we discuss earlier?",
  );
  expect(memory.retrieved).toEqual([]);
  expect(memory.summary).toBeUndefined();
  await expect(
    clearConversation(s.id, memberId, s.revision),
  ).rejects.toMatchObject({ status: 409 });
  expect((await getSession(s.id, memberId)).revision).toBe(s.revision + 1);
});
it("logs out, rejects invalid credentials and expired sessions", async () => {
  await member.post("/api/auth/logout").set("Origin", origin).expect(204);
  await member.get("/api/auth/me").expect(401);
  await member
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email, password: "wrong-password" })
    .expect(401);
  await member
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: email.toUpperCase(), password })
    .expect(200);
  await db.authSession.updateMany({
    where: { adminId: memberId },
    data: { expiresAt: new Date(0) },
  });
  await member.get("/api/auth/me").expect(401);
});
it("consumes an invitation only once during concurrent registration", async () => {
  const code = randomUUID(),
    address = `${prefix}-race@test.local`;
  await db.accountInvite.create({
    data: {
      tokenHash: tokenHash(code),
      email: address,
      expiresAt: new Date(Date.now() + 60000),
      createdBy: founderId,
    },
  });
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app)
        .post("/api/auth/register")
        .set("Origin", origin)
        .send({ email: address, password, invite: code }),
    ),
  );
  expect(responses.map((r) => r.status).sort()).toEqual([201, 400]);
  const rows = await db.adminUser.findMany({ where: { email: address } });
  owners.push(...rows.map((r) => r.id));
  expect(rows).toHaveLength(1);
  expect(rows[0].role).toBe("member");
});
it("rate-limits repeated login and signup attempts", async () => {
  for (const path of ["login", "register"]) {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await request(app)
            .post(`/api/auth/${path}`)
            .set("Origin", origin)
            .send({
              email: `${prefix}-invalid@test.local`,
              password,
              ...(path === "register" ? { invite: "invalid" } : {}),
            })
        ).status,
      );
    expect(statuses).toContain(429);
  }
});
