import { beforeAll, afterAll, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import {
  getSession,
  submitAnswer,
  assess,
  getReport,
  canvas,
  converse,
  confirmBatch,
} from "../src/session-service.js";
import { purgeExpiredGuests } from "../src/guest-lifecycle.js";
import { exploratoryPersona } from "./consulting-fixture.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use isolated _test database");
const agent = request.agent(app),
  other = request.agent(app),
  owners: string[] = [];
let owner: string,
  id: string,
  planId: string,
  snapshot: string,
  original: unknown;
const origin = config.APP_ORIGIN;
beforeAll(async () => {
  const created = await agent
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  expect(String(created.headers["set-cookie"])).not.toMatch(
    /Max-Age|Expires=/i,
  );
  ({ adminId: owner, id, planId } = created.body);
  owners.push(owner);
  let s = await getSession(id, owner);
  for (const [questionId, value] of Object.entries(exploratoryPersona))
    s = await submitAnswer(id, owner, {
      revision: s.revision,
      questionId,
      value,
    });
  const report = await assess(id, owner, s.revision);
  snapshot = report.reportId;
  original = (await getReport(id, owner)).content;
  const outsider = await other
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(outsider.body.adminId);
});
afterAll(async () => {
  const sessions = await db.discoverySession.findMany({
    where: { adminId: { in: owners } },
    select: { subjectId: true },
  });
  await db.discoverySession.deleteMany({ where: { adminId: { in: owners } } });
  await db.subject.deleteMany({
    where: {
      id: { in: sessions.map((s) => s.subjectId) },
      sessions: { none: {} },
    },
  });
  await db.auditEvent.deleteMany({ where: { actorId: { in: owners } } });
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("persists validated conversation names, rejects stale writes and protects ownership", async () => {
  const s = await getSession(id, owner),
    path = `/api/guest/plans/${planId}/sessions/${id}`;
  await other
    .patch(path)
    .set("Origin", origin)
    .send({ revision: s.revision, title: "Foreign title" })
    .expect(404);
  await agent
    .patch(path)
    .set("Origin", origin)
    .send({ revision: s.revision, title: "bad\ntitle" })
    .expect(400);
  await agent
    .patch(path)
    .set("Origin", origin)
    .send({ revision: s.revision, title: "Small income experiments" })
    .expect(200);
  expect((await getSession(id, owner)).title).toBe("Small income experiments");
  await agent
    .patch(path)
    .set("Origin", origin)
    .send({ revision: s.revision, title: "Stale title" })
    .expect(409);
  expect(
    (await agent.get(`/api/guest/plans/${planId}/sessions`).expect(200)).body
      .sessions[0].title,
  ).toBe("Small income experiments");
});
it("saves live refinements and decisions, invalidates guidance, and leaves snapshots immutable", async () => {
  const before = await canvas(id, owner),
    previous = (await getSession(id, owner)).knowledgeRevision;
  expect(before.graph.nodes.some((n) => n.id === "visual-design")).toBe(true);
  const state = {
    edits: {
      "visual-design": {
        title: "Invitation pilot",
        notes: "One invitation using my current tools, with one revision only.",
        decision: "selected",
      },
      coordination: { decision: "rejected" },
    },
    additions: [
      {
        id: crypto.randomUUID(),
        kind: "constraint",
        title: "Remote work only",
        notes: "I cannot travel for deliveries.",
      },
    ],
  };
  await other
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: before.projectRevision, state })
    .expect(404);
  await agent
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: before.projectRevision, state })
    .expect(200);
  await agent
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: before.projectRevision, state })
    .expect(409);
  const updated = await canvas(id, owner);
  expect(updated.state).toEqual(state);
  expect(new Set(updated.graph.nodes.map((n) => n.id)).size).toBe(
    updated.graph.nodes.length,
  );
  expect(
    updated.graph.nodes.find((n) => n.id === "visual-design"),
  ).toMatchObject({ title: "Invitation pilot", decision: "selected" });
  expect((await getSession(id, owner)).knowledgeRevision).toBe(previous + 1);
  expect((await getReport(id, owner)).stale).toBe(true);
  expect(
    (
      await agent
        .get(`/api/guest/plans/${planId}/reports/${snapshot}`)
        .expect(200)
    ).body.content,
  ).toEqual(original);
  let s = await getSession(id, owner);
  const chat = await converse(
    id,
    owner,
    {
      revision: s.revision,
      message: "Explain the recommendations and experiment costs",
      mode: "conversation",
    },
    true,
  );
  expect(
    chat.session.messages.filter((m) => m.role === "assistant").at(-1)!.content,
  ).toContain("Invitation pilot");
  expect(
    chat.session.messages.filter((m) => m.role === "assistant").at(-1)!.content,
  ).not.toContain("Planning and organisation assistance:");
  expect(
    chat.session.messages.filter((m) => m.role === "assistant").at(-1)!.content,
  ).toContain("one revision only");
  s = await getSession(id, owner);
  const fresh = await assess(id, owner, s.revision);
  expect(fresh.reportId).not.toBe(snapshot);
  expect(
    (await getReport(id, owner)).content.consulting?.directions[0].title,
  ).toBe("Invitation pilot");
  // Undo uses the same revision-checked path, not a report rewrite.
  const latest = await canvas(id, owner);
  await agent
    .put(`/api/guest/plans/${planId}/canvas`)
    .set("Origin", origin)
    .send({ revision: latest.projectRevision, state: before.state })
    .expect(200);
  expect((await canvas(id, owner)).state).toEqual(before.state);
  expect(
    (
      await agent
        .get(`/api/guest/plans/${planId}/reports/${snapshot}`)
        .expect(200)
    ).body.content,
  ).toEqual(original);
  const pdf = await agent
    .get(`/api/guest/plans/${planId}/reports/${fresh.reportId}/pdf`)
    .expect(200);
  expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
});
it("cleans expired guest work without affecting active guests or account-owned work", async () => {
  const expired = request.agent(app);
  const created = await expired
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(created.body.adminId);
  await db.projectSource.create({
    data: {
      planId: created.body.planId,
      kind: "note",
      title: "Temporary",
      content: "Remove on expiry",
      status: "ready",
    },
  });
  const account = await db.adminUser.create({
    data: {
      email: `expiry-${crypto.randomUUID()}@test.local`,
      passwordHash: "unused",
      isGuest: false,
    },
  });
  owners.push(account.id);
  await db.authSession.updateMany({
    where: { adminId: created.body.adminId },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  await purgeExpiredGuests();
  expect(
    await db.adminUser.findUnique({ where: { id: created.body.adminId } }),
  ).toBeNull();
  expect(
    await db.projectSource.count({ where: { planId: created.body.planId } }),
  ).toBe(0);
  expect(
    await db.adminUser.findUnique({ where: { id: account.id } }),
  ).not.toBeNull();
  await agent.get(`/api/guest/sessions/${id}`).expect(200);
});

it("filters the project library before pagination and keeps ownership checks", async () => {
  await agent
    .post(`/api/guest/plans/${planId}/sources`)
    .set("Origin", origin)
    .send({
      kind: "note",
      title: "Pilot scope",
      content: "One invitation with one revision.",
    })
    .expect(201);
  await agent
    .post(`/api/guest/plans/${planId}/sources`)
    .set("Origin", origin)
    .send({
      kind: "link",
      title: "Reference to check",
      url: "https://example.com/reference",
    })
    .expect(201);
  await agent
    .post(`/api/guest/plans/${planId}/sources/file`)
    .set("Origin", origin)
    .set("Content-Type", "application/octet-stream")
    .set("X-File-Name", "pilot.txt")
    .send(Buffer.from("Synthetic pilot notes"))
    .expect(201);
  for (const [category, kind] of [
    ["notes", "note"],
    ["references", "link"],
    ["documents", "text"],
  ]) {
    const result = await agent
      .get(`/api/guest/plans/${planId}/sources?category=${category}`)
      .expect(200);
    expect(result.body.sources).toHaveLength(1);
    expect(result.body.sources[0].kind).toBe(kind);
  }
  await other
    .get(`/api/guest/plans/${planId}/sources?category=notes`)
    .expect(404);
});
it("corrects a Canvas fact through the existing answer path without rewriting reports", async () => {
  const s = await getSession(id, owner);
  await agent
    .put(`/api/guest/sessions/${id}/answers`)
    .set("Origin", origin)
    .send({
      revision: s.revision,
      questionId: "explorationTime",
      value: "I now have 3 hours per week and will use my existing laptop.",
    })
    .expect(200);
  const live = await canvas(id, owner);
  expect(
    live.consulting?.directions.every((d) => d.timeDemand.includes("3 hours")),
  ).toBe(true);
  expect(
    (
      await agent
        .get(`/api/guest/plans/${planId}/reports/${snapshot}`)
        .expect(200)
    ).body.content,
  ).toEqual(original);
});
it("propagates operational priorities and every Canvas decision into Chat and future immutable reports", async () => {
  const { logisticsPersona } = await import("./operations-fixture.js");
  const logistics = request.agent(app);
  const created = await logistics
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  const { id: sessionId, adminId: principal, planId: project } = created.body;
  owners.push(principal);
  let s = await getSession(sessionId, principal);
  for (const [questionId, value] of Object.entries({
    ...logisticsPersona,
    problems: ["custom"],
  }).filter(([key]) => key !== "scopeDetails"))
    s = await submitAnswer(sessionId, principal, {
      revision: s.revision,
      questionId,
      value,
    });
  // Scope is submitted after the validated application branch exists.
  s = await submitAnswer(sessionId, principal, {
    revision: s.revision,
    questionId: "scopeDetails",
    value: logisticsPersona.scopeDetails!,
  });
  const originalReport = await assess(sessionId, principal, s.revision);
  expect(
    originalReport.content.consulting?.requirements?.filter(
      (r) => r.priority === "essential",
    ),
  ).toHaveLength(10);
  expect(originalReport.content.recommendations[0].solution).toContain(
    "delivery-management",
  );
  const originalContent = JSON.stringify(originalReport.content);
  for (const decision of [
    "selected",
    "developing",
    "deferred",
    "rejected",
    "exploring",
  ] as const) {
    const before = await canvas(sessionId, principal);
    await logistics
      .put(`/api/guest/plans/${project}/canvas`)
      .set("Origin", origin)
      .send({
        revision: before.projectRevision,
        state: {
          ...before.state,
          edits: {
            ...before.state.edits,
            integration: { decision },
            "requirement-dashboard": { priority: "optional" },
          },
        },
      })
      .expect(200);
    const current = await canvas(sessionId, principal);
    expect(
      current.graph.nodes.find((n) => n.id === "integration")?.decision,
    ).toBe(decision);
    expect(
      current.consulting?.requirements?.find(
        (r) => r.id === "requirement-dashboard",
      )?.priority,
    ).toBe("optional");
    s = await getSession(sessionId, principal);
    const chat = await converse(
      sessionId,
      principal,
      {
        revision: s.revision,
        mode: "conversation",
        message: "Explain the recorded direction and develop a pilot plan",
      },
      true,
    );
    const answer = chat.session.messages
      .filter((m) => m.role === "assistant")
      .at(-1)!.content;
    expect(answer).toContain(decision);
    expect(answer).toContain("not approval to purchase");
    s = await getSession(sessionId, principal);
    const nextReport = await assess(sessionId, principal, s.revision);
    expect(nextReport.reportId).not.toBe(originalReport.reportId);
    expect(nextReport.content.consulting?.directions[0].status).toBe(
      decision === "exploring" ? "hypothesis" : decision,
    );
  }
  s = await getSession(sessionId, principal);
  const correction = await converse(
    sessionId,
    principal,
    {
      revision: s.revision,
      mode: "conversation",
      message: "Actually, the operations dashboard is now essential.",
    },
    true,
  );
  const pending = correction.session.evidence.filter(
    (e) => e.active && e.status === "inferred" && e.key === "clarification",
  );
  expect(pending).toHaveLength(1);
  s = await confirmBatch(
    sessionId,
    principal,
    correction.session.revision,
    pending.map((e) => e.id),
    true,
  );
  expect(
    (await canvas(sessionId, principal)).consulting?.requirements?.find(
      (r) => r.id === "requirement-dashboard",
    )?.priority,
  ).toBe("essential");
  const saved = await logistics
    .get(`/api/guest/plans/${project}/reports/${originalReport.reportId}`)
    .expect(200);
  expect(JSON.stringify(saved.body.content)).toBe(originalContent);
  await other
    .get(`/api/guest/plans/${project}/reports/${originalReport.reportId}`)
    .expect(404);
  const pdf = await logistics
    .get(`/api/guest/plans/${project}/reports/${originalReport.reportId}/pdf`)
    .expect(200);
  expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
});
