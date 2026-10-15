import { beforeAll, afterAll, it, expect } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { createPlan, newDiscovery } from "../src/plan-service.js";
import {
  getSession,
  converse,
  confirmBatch,
  assess,
  answersOf,
  clearConversation,
} from "../src/session-service.js";
import { readPersonalMemory } from "../src/personal-memory.js";
import { services } from "../../data/services.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use isolated _test database");
const prefix = `workspace-${randomUUID()}`;
const a = request.agent(app),
  b = request.agent(app),
  guest = request.agent(app);
const owners: string[] = [];
let owner: string;
const origin = config.APP_ORIGIN;
beforeAll(async () => {
  for (const [client, label] of [
    [a, "a"],
    [b, "b"],
  ] as const) {
    const account = await db.adminUser.create({
      data: {
        email: `${prefix}-${label}@test.local`,
        passwordHash: await hashPassword("workspace-test-password"),
      },
    });
    owners.push(account.id);
    if (label === "a") owner = account.id;
    await client
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: account.email, password: "workspace-test-password" })
      .expect(200);
  }
  for (const service of services)
    await db.service.upsert({
      where: { id: service.id },
      create: service,
      update: service,
    });
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
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("resumes one guest project, serializes repeat entry and rejects extra project creation", async () => {
  const first = await guest
    .post("/api/guest/sessions")
    .set("Origin", origin)
    .send({})
    .expect(201);
  owners.push(first.body.adminId);
  const entries = await Promise.all(
    Array.from({ length: 4 }, () =>
      guest.post("/api/guest/sessions").set("Origin", origin).send({}),
    ),
  );
  expect(entries.every((r) => r.body.id === first.body.id)).toBe(true);
  expect(await db.plan.count({ where: { adminId: first.body.adminId } })).toBe(
    1,
  );
  await guest
    .post("/api/guest/plans")
    .set("Origin", origin)
    .send({ title: "Another project", creationKey: randomUUID() })
    .expect(409);
  await a.get(`/api/guest/sessions/${first.body.id}`).expect(401);
  await guest.get("/api/cases").expect(401);
});
it("restores selected account project through the discovery entry endpoint", async () => {
  const first = await a
    .post("/api/sessions/entry")
    .set("Origin", origin)
    .send({})
    .expect(200);
  const count = await db.plan.count({ where: { adminId: owner } });
  const again = await a
    .post("/api/sessions/entry")
    .set("Origin", origin)
    .send({})
    .expect(200);
  expect(again.body.id).toBe(first.body.id);
  expect(await db.plan.count({ where: { adminId: owner } })).toBe(count);
  await a.post("/api/sessions/entry").send({}).expect(403);
});
it("carries confirmed project context into an explicit new conversation, preserves report versions and isolates retrieval", async () => {
  const p = await createPlan(owner, {
    title: "Nail studio",
    description: "",
    creationKey: randomUUID(),
  });
  let s = await getSession(p.lastSessionId!, owner);
  s = (
    await converse(
      s.id,
      owner,
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
    owner,
    s.revision,
    s.evidence.filter((e) => e.status === "inferred").map((e) => e.id),
    true,
  );
  const old = await assess(s.id, owner, s.revision);
  const fresh = await a
    .post(`/api/plans/${p.id}/sessions`)
    .set("Origin", origin)
    .send({
      revision: p.revision,
      creationKey: randomUUID(),
      carryContext: true,
    })
    .expect(201);
  let next = await getSession(fresh.body.sessionId, owner);
  expect(answersOf(next)).toEqual(answersOf(s));
  expect(next.messages).toHaveLength(0);
  expect(next.evidence.every((e) => e.status === "confirmed")).toBe(true);
  expect(
    next.evidence.some(
      (e) => (e.provenance as any)?.inheritedFromSessionId === s.id,
    ),
  ).toBe(true);
  const memory = await readPersonalMemory(
    next,
    "Discuss the previous analysis and nail portfolio website",
  );
  expect(memory.retrieved.some((r) => r.id === old.reportId)).toBe(true);
  expect(memory.retrieved.some((r) => r.content.includes("nail"))).toBe(true);
  const isolated = await createPlan(owner, {
    title: "Independent project",
    description: "",
    creationKey: randomUUID(),
  });
  const isolatedSession = await getSession(isolated.lastSessionId!, owner);
  expect(
    (
      await readPersonalMemory(
        isolatedSession,
        "Discuss the previous nail analysis",
      )
    ).retrieved,
  ).toEqual([]);
  const otherOwner = await createPlan(owners[1], {
    title: "Separate owner",
    description: "",
    creationKey: randomUUID(),
  });
  expect(
    (
      await readPersonalMemory(
        await getSession(otherOwner.lastSessionId!, owners[1]),
        "Discuss the previous nail analysis",
      )
    ).retrieved,
  ).toEqual([]);
  const updated = await assess(next.id, owner, next.revision);
  expect(updated.reportId).not.toBe(old.reportId);
  const listing = await a.get(`/api/plans/${p.id}/reports`).expect(200);
  expect(listing.body.reports.map((r: any) => r.id)).toEqual(
    expect.arrayContaining([old.reportId, updated.reportId]),
  );
  const pdf = await a
    .get(`/api/plans/${p.id}/reports/${old.reportId}/pdf`)
    .expect(200);
  expect(pdf.headers["content-type"]).toMatch(/application\/pdf/);
  expect(pdf.body.subarray(0, 4).toString()).toBe("%PDF");
  await b.get(`/api/plans/${p.id}/reports/${old.reportId}/pdf`).expect(404);
  await a
    .get(`/api/plans/${isolated.id}/reports/${old.reportId}/pdf`)
    .expect(404);
  await guest
    .get(`/api/guest/plans/${p.id}/reports/${old.reportId}/pdf`)
    .expect(404);
  // Clearing old discussion prevents it from reappearing as cross-conversation memory.
  s = await clearConversation(s.id, owner, s.revision);
  const afterClear = await readPersonalMemory(next, "nail portfolio website");
  expect(
    afterClear.retrieved.some((r) => s.messages.some((m) => m.id === r.id)),
  ).toBe(false);
  const original = await a
    .get(`/api/plans/${p.id}/reports/${old.reportId}`)
    .expect(200);
  expect(original.body.content).toEqual(old.content);
});
