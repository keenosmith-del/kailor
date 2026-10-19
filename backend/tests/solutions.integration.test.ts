import { beforeAll, afterAll, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import {
  getSession,
  submitAnswer,
  canvas,
  assess,
} from "../src/session-service.js";
import { saveCanvas } from "../src/workspace-service.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use isolated _test database");
const guest = request.agent(app),
  account = request.agent(app),
  outsider = request.agent(app),
  owners: string[] = [];
const origin = config.APP_ORIGIN;
let sessionId: string,
  planId: string,
  ownerId: string,
  guestCookie: string,
  memberCookie: string;
beforeAll(async () => {
  const created = await guest
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  guestCookie = created.headers["set-cookie"][0].split(";")[0];
  ({ id: sessionId, planId, adminId: ownerId } = created.body);
  owners.push(ownerId);
  let s = await getSession(sessionId, ownerId);
  for (const [questionId, value] of Object.entries({
    stage: "established",
    kind: "business",
    industry: "I run a small plumbing business.",
    goals:
      "I need a professional website and help setting up my business Instagram page.",
  }))
    s = await submitAnswer(sessionId, ownerId, {
      revision: s.revision,
      questionId,
      value,
    });
  const other = await outsider
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(other.body.adminId);
  const { hashPassword } = await import("../src/auth.js");
  const member = await db.adminUser.create({
    data: {
      email: `solutions-${crypto.randomUUID()}@example.test`,
      passwordHash: await hashPassword("Solution-test-password-123"),
      role: "member",
    },
  });
  owners.push(member.id);
  const login = await account
    .post("/api/auth/login")
    .set("Origin", origin)
    .send({ email: member.email, password: "Solution-test-password-123" })
    .expect(200);
  memberCookie = login.headers["set-cookie"][0].split(";")[0];
});
afterAll(async () => {
  await db.consultancyRequest.deleteMany({
    where: { ownerId: { in: owners } },
  });
  const rows = await db.discoverySession.findMany({
    where: { adminId: { in: owners } },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: { in: owners } } });
  await db.subject.deleteMany({
    where: { id: { in: rows.map((s) => s.subjectId) }, sessions: { none: {} } },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: owners } } });
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("persists independent guest selections with project isolation and an unchanged report snapshot", async () => {
  const before = await assess(
    sessionId,
    ownerId,
    (await getSession(sessionId, ownerId)).revision,
  );
  const original = await db.reportSnapshot.findUniqueOrThrow({
    where: { id: before.reportId },
  });
  const c = await canvas(sessionId, ownerId);
  expect(c.solutions).toHaveLength(2);
  const state = {
    ...c.state,
    selections: Object.fromEntries(
      c.solutions.map((s) => [
        s.id,
        {
          selected: true,
          basisRevision: s.revision,
          updatedAt: new Date().toISOString(),
        },
      ]),
    ),
  };
  await guest
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: c.projectRevision, state })
    .expect(200);
  const saved = await guest
    .get(`/api/guest/sessions/${sessionId}/canvas`)
    .expect(200);
  expect(
    saved.body.solutions.every((s: any) => s.selected && !s.reviewRequired),
  ).toBe(true);
  await outsider.get(`/api/guest/sessions/${sessionId}/canvas`).expect(404);
  await outsider
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: saved.body.projectRevision, state })
    .expect(404);
  await guest
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: c.projectRevision, state })
    .expect(409);
  expect(
    (
      await db.reportSnapshot.findUniqueOrThrow({
        where: { id: before.reportId },
      })
    ).content,
  ).toEqual(original.content);
});
it("exports a current reasoning PDF with ownership protection", async () => {
  const c = await canvas(sessionId, ownerId),
    path = `/api/guest/sessions/${sessionId}/solutions/${c.solutions[0].id}/reasoning`;
  const pdf = await guest.get(path).expect(200);
  expect(pdf.headers["content-type"]).toContain("application/pdf");
  expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
  await outsider.get(path).expect(404);
  await guest
    .get(`/api/guest/sessions/${sessionId}/solutions/missing/reasoning`)
    .expect(404);
});
it("requires account ownership, snapshots combined scope and exposes received requests only to admins", async () => {
  let c = await canvas(sessionId, ownerId);
  const input = {
    sessionId,
    requestKey: crypto.randomUUID(),
    projectRevision: c.projectRevision,
    solutions: c.solutions.map((s) => ({ id: s.id, revision: s.revision })),
    notes: "Please review the two solutions together.",
  };
  await guest
    .post(`/api/guest/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send(input)
    .expect(401);
  await guest.get("/api/guest/consultancy-requests").expect(403);
  await account
    .post(`/api/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send(input)
    .expect(404);
  // Existing explicit guest-to-account transfer preserves project and solution identities.
  await account
    .post("/api/guest/transfer")
    .set("Origin", origin)
    .set("Cookie", `${memberCookie}; ${guestCookie}`)
    .send({ consent: true, transferKey: crypto.randomUUID(), planId })
    .expect(200);
  ownerId = (await db.plan.findUniqueOrThrow({ where: { id: planId } }))
    .adminId;
  c = await canvas(sessionId, ownerId);
  input.projectRevision = c.projectRevision;
  const response = await account
    .post(`/api/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send(input)
    .expect(201);
  expect(response.body.status).toBe("pending");
  const retry = await account
    .post(`/api/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send(input)
    .expect(201);
  expect(retry.body.id).toBe(response.body.id);
  const stored = await db.consultancyRequest.findUniqueOrThrow({
    where: { id: response.body.id },
  });
  expect((stored.scope as any).solutions).toHaveLength(2);
  expect(stored.notes).toBe(input.notes);
  await account.get(`/api/plans/${planId}/consultancy-requests`).expect(200);
  await account.get("/api/consultancy-requests").expect(403);
  await db.adminUser.update({
    where: { id: ownerId },
    data: { role: "admin" },
  });
  const inbox = await account.get("/api/consultancy-requests").expect(200);
  expect(inbox.body.requests.some((r: any) => r.id === response.body.id)).toBe(
    true,
  );
  const stale = {
    ...input,
    requestKey: crypto.randomUUID(),
    solutions: input.solutions.map((s) => ({ ...s, revision: s.revision + 1 })),
  };
  await account
    .post(`/api/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send(stale)
    .expect(409);
  const latest = await canvas(sessionId, ownerId);
  await saveCanvas(planId, ownerId, latest.projectRevision, {
    ...latest.state,
    edits: {
      ...latest.state.edits,
      website: { notes: "A changed first phase with a booking requirement." },
    },
  });
  const changed = await canvas(sessionId, ownerId);
  expect(changed.solutions.some((s) => s.reviewRequired)).toBe(true);
  await account
    .post(`/api/plans/${planId}/consultancy-requests`)
    .set("Origin", origin)
    .send({
      ...input,
      requestKey: crypto.randomUUID(),
      projectRevision: changed.projectRevision,
      solutions: changed.solutions.map((s) => ({
        id: s.id,
        revision: s.revision,
      })),
    })
    .expect(409);
  expect(
    (
      await db.consultancyRequest.findUniqueOrThrow({
        where: { id: stored.id },
      })
    ).scope,
  ).toEqual(stored.scope);
});

import { grooming } from "./grooming-fixture.js";
import { converse } from "../src/session-service.js";
it("runs the exact grooming guest brief and propagates Canvas-only scope through Chat, export and isolation", async () => {
  const agent = request.agent(app);
  const created = await agent
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  const id = created.body.id,
    project = created.body.planId,
    owner = created.body.adminId;
  owners.push(owner);
  let s = await getSession(id, owner);
  for (const [questionId, value] of Object.entries(grooming))
    s = await submitAnswer(id, owner, {
      revision: s.revision,
      questionId,
      value,
    });
  const assessment = await assess(id, owner, s.revision);
  const snapshot = await db.reportSnapshot.findUniqueOrThrow({
    where: { id: assessment.reportId },
  });
  let c = await canvas(id, owner);
  expect(c.solutions.map((x) => x.id).sort()).toEqual(["instagram", "website"]);
  const socialRevision = c.solutions.find(
    (x) => x.id === "instagram",
  )!.revision;
  const guide = "Downloadable grooming preparation guide";
  const guideId = crypto.randomUUID();
  for (const priority of ["essential", "deferred"] as const) {
    await saveCanvas(project, owner, c.projectRevision, {
      ...c.state,
      edits: {
        ...c.state.edits,
        website: { capabilities: [{ id: guideId, label: guide, priority }] },
      },
    });
    c = await canvas(id, owner);
    expect(c.solutions.find((x) => x.id === "instagram")!.revision).toBe(
      socialRevision,
    );
    s = await getSession(id, owner);
    const reply = await converse(
      id,
      owner,
      {
        revision: s.revision,
        mode: "conversation",
        message: "What new feature did I add to this solution?",
        solutionId: "website",
      },
      true,
    );
    expect(
      reply.session.messages.filter((m) => m.role === "assistant").at(-1)!
        .content,
    ).toContain(`${guide}: ${priority}`);
  }
  await saveCanvas(project, owner, c.projectRevision, {
    ...c.state,
    edits: { ...c.state.edits, website: { capabilities: [] } },
  });
  c = await canvas(id, owner);
  s = await getSession(id, owner);
  const removed = await converse(
    id,
    owner,
    {
      revision: s.revision,
      mode: "conversation",
      message: "What new feature did I add to this solution?",
      solutionId: "website",
    },
    true,
  );
  expect(
    removed.session.messages.filter((m) => m.role === "assistant").at(-1)!
      .content,
  ).not.toContain(guide);
  s = await getSession(id, owner);
  await expect(
    converse(
      id,
      owner,
      {
        revision: s.revision,
        mode: "conversation",
        message: "What is included?",
        solutionId: "foreign-solution",
      },
      true,
    ),
  ).rejects.toMatchObject({ status: 404 });
  const pdf = await agent
    .get(`/api/guest/sessions/${id}/solutions/website/reasoning`)
    .expect(200);
  expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
  await outsider.get(`/api/guest/sessions/${id}/canvas`).expect(404);
  expect(
    JSON.stringify((await canvas(sessionId, ownerId)).solutions),
  ).not.toContain(guide);
  expect(
    (
      await db.reportSnapshot.findUniqueOrThrow({
        where: { id: assessment.reportId },
      })
    ).content,
  ).toEqual(snapshot.content);
});
