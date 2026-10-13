import { beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { services } from "../../data/services.js";
import { seededCases, scenarios, personas } from "../src/library.js";
import { json, reserveUsage } from "../src/session-service.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw new Error(
    "Integration tests require DATABASE_URL pointing to an isolated database ending in _test",
  );
const client = request.agent(app),
  origin = config.APP_ORIGIN;
const adminEmail = `test-${Date.now()}@kailor.local`,
  password = "test-only-strong-password";
const guestOwners: string[] = [];
let adminId: string,
  id: string,
  revision = 0;
beforeAll(async () => {
  const admin = await db.adminUser.create({
    data: { email: adminEmail, passwordHash: await hashPassword(password) },
  });
  adminId = admin.id;
  for (const s of services)
    await db.service.upsert({ where: { id: s.id }, create: s, update: s });
  for (const c of seededCases)
    await db.caseIntelligenceRecord.upsert({
      where: { id: c.id },
      create: { ...c, pattern: json(c.pattern) },
      update: {},
    });
  for (const s of scenarios)
    await db.scenarioTemplate.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        title: s.title,
        industry: s.industry,
        definition: json(s),
      },
      update: {},
    });
}, 30000);
const globalAdminId = () => adminId;
afterAll(async () => {
  for (const adminId of [globalAdminId(), ...guestOwners].filter(Boolean)) {
    await db.caseIntelligenceRecord.deleteMany({
      where: { sourceRun: { session: { adminId } } },
    });
    const subjects = await db.discoverySession.findMany({
      where: { adminId },
      select: { subjectId: true },
    });
    await db.discoverySession.deleteMany({ where: { adminId } });
    await db.subject.deleteMany({
      where: { id: { in: subjects.map((s) => s.subjectId) } },
    });
    await db.auditEvent.deleteMany({ where: { actorId: adminId } });
    await db.adminUser.delete({ where: { id: adminId } });
  }
  await db.$disconnect();
});
describe("real PostgreSQL API vertical slice", () => {
  it("rejects unauthenticated and cross-origin mutations", async () => {
    expect((await request(app).get("/api/sessions")).status).toBe(401);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", "https://evil.example")
          .send({ email: adminEmail, password })
      ).status,
    ).toBe(403);
  });
  it("authenticates with an HttpOnly cookie", async () => {
    const response = await client
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: adminEmail, password });
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Strict");
  });
  it("creates a persistent session", async () => {
    const r = await client
      .post("/api/sessions")
      .set("Origin", origin)
      .send({ name: "Integration subject" });
    expect(r.status).toBe(201);
    id = r.body.id;
    expect((await client.get(`/api/sessions/${id}`)).body.subject.name).toBe(
      "Integration subject",
    );
    expect(
      await db.subject.count({ where: { name: "Integration subject" } }),
    ).toBeGreaterThan(0);
  });
  it("validates malformed, unknown and irrelevant answers", async () => {
    for (const input of [
      { questionId: "stage", value: "bad" },
      { questionId: "idea", value: "irrelevant" },
      { questionId: "goals", value: 3 },
    ]) {
      const r = await client
        .put(`/api/sessions/${id}/answers`)
        .set("Origin", origin)
        .send({ revision, ...input });
      expect(r.status).toBe(400);
    }
  });
  it("persists branching answers and removes stale branch facts on editing", async () => {
    for (const [questionId, value] of [
      ["stage", "starting"],
      ["idea", "A new thing"],
      ["stage", "established"],
    ]) {
      const r = await client
        .put(`/api/sessions/${id}/answers`)
        .set("Origin", origin)
        .send({ revision, questionId, value });
      expect(r.status).toBe(200);
      revision = r.body.revision;
    }
    const s = (await client.get(`/api/sessions/${id}`)).body;
    expect(s.answers.some((a: any) => a.questionId === "idea")).toBe(false);
    expect(s.evidence.some((e: any) => e.key === "idea")).toBe(false);
    expect(
      await db.evidence.count({
        where: { sessionId: id, key: "idea", active: false },
      }),
    ).toBe(1);
  });
  it("rejects stale revisions and serializes concurrent edits", async () => {
    expect(
      (
        await client
          .put(`/api/sessions/${id}/answers`)
          .set("Origin", origin)
          .send({ revision: 0, questionId: "goals", value: "Old write" })
      ).status,
    ).toBe(409);
    const responses = await Promise.all(
      ["A", "B"].map((value) =>
        client
          .put(`/api/sessions/${id}/answers`)
          .set("Origin", origin)
          .send({ revision, questionId: "goals", value }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    revision++;
  });
  it("chat receives context and only confirmed proposals update answers", async () => {
    let r = await client
      .post(`/api/sessions/${id}/chat`)
      .set("Origin", origin)
      .send({ revision, message: "set goals: Confirmed from chat" });
    expect(r.status).toBe(200);
    expect(r.body.provider).toBe("mock-development");
    revision = r.body.session.revision;
    expect(
      r.body.session.answers.find((a: any) => a.questionId === "goals").value,
    ).not.toBe("Confirmed from chat");
    const evidence = r.body.session.evidence.find(
      (e: any) => e.status === "inferred",
    );
    r = await client
      .post(`/api/sessions/${id}/evidence/${evidence.id}`)
      .set("Origin", origin)
      .send({ revision, accept: true });
    expect(r.status).toBe(200);
    revision = r.body.revision;
    expect(
      r.body.answers.find((a: any) => a.questionId === "goals").value,
    ).toBe("Confirmed from chat");
    expect(r.body.messages).toHaveLength(2);
  });
  it("requires assessment evidence", async () =>
    expect(
      (
        await client
          .post(`/api/sessions/${id}/assessment`)
          .set("Origin", origin)
          .send({ revision })
      ).status,
    ).toBe(422));
  it("generates immutable reports, proportional recommendations and PDF", async () => {
    for (const [questionId, value] of Object.entries({
      industry: "Nail technician",
      presence: ["instagram"],
      problems: ["credibility"],
    })) {
      const r = await client
        .put(`/api/sessions/${id}/answers`)
        .set("Origin", origin)
        .send({ revision, questionId, value });
      expect(r.status).toBe(200);
      revision = r.body.revision;
    }
    const assessment = await client
      .post(`/api/sessions/${id}/assessment`)
      .set("Origin", origin)
      .send({ revision });
    expect(assessment.status).toBe(200);
    const ids = assessment.body.content.recommendations.map(
      (r: any) => r.serviceId,
    );
    expect(ids).toContain("website");
    expect(ids).not.toContain("booking");
    const again = await client
      .post(`/api/sessions/${id}/assessment`)
      .set("Origin", origin)
      .send({ revision });
    expect(again.body.reportId).toBe(assessment.body.reportId);
    const report = await client.get(`/api/sessions/${id}/report`);
    expect(report.body.content).toEqual(assessment.body.content);
    expect(report.body.stale).toBe(false);
    const pdf = await client.get(`/api/sessions/${id}/report.pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-type"]).toContain("application/pdf");
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    const r = await client
      .put(`/api/sessions/${id}/answers`)
      .set("Origin", origin)
      .send({ revision, questionId: "goals", value: "A revised goal" });
    revision = r.body.revision;
    expect((await client.get(`/api/sessions/${id}/report`)).body.stale).toBe(
      true,
    );
    expect(
      (await client.get(`/api/sessions/${id}/canvas`)).body.components.map(
        (c: any) => c.id,
      ),
    ).toContain("website");
  });
  it("reserves inference limits atomically across concurrent calls", async () => {
    const reservations = await Promise.all(
      Array.from({ length: 8 }, () => reserveUsage(id, "conversation")),
    );
    expect(reservations.filter(Boolean)).toHaveLength(5);
    expect(await db.aiUsageRecord.count({ where: { sessionId: id } })).toBe(5);
    const dailyLimit = config.AI_MAX_CALLS_PER_DAY;
    config.AI_MAX_CALLS_PER_DAY = 5;
    try {
      expect(await reserveUsage(id, "analysis")).toBeNull();
    } finally {
      config.AI_MAX_CALLS_PER_DAY = dailyLimit;
    }
  });
  it.each(personas)(
    "executes and stores synthetic persona $id using the real services",
    async (persona) => {
      const run = await client
        .post("/api/simulations")
        .set("Origin", origin)
        .send({ personaId: persona.id });
      expect(run.status).toBe(201);
      expect(run.body.passed).toBe(true);
      expect(run.body.approvalStatus).toBe("pending");
      expect(run.body.report.synthetic).toBe(true);
      expect(run.body.discoveryPath.length).toBeGreaterThanOrEqual(10);
      const record = await db.caseIntelligenceRecord.findFirstOrThrow({
        where: { sourceRunId: run.body.id },
      });
      expect(record.reviewStatus).toBe("pending");
      expect(record.sourceType).toBe("simulation");
      const reviewed = await client
        .put(`/api/cases/${record.id}/review`)
        .set("Origin", origin)
        .send({
          status: "approved",
          notes:
            "Reviewed as a synthetic reusable pattern; no private identifying data.",
          title: "Reviewed synthetic workflow",
          pattern: record.pattern,
        });
      expect(reviewed.status).toBe(200);
      expect(reviewed.body.sourceType).toBe("simulation");
      expect(reviewed.body.reviewStatus).toBe("approved");
      expect(
        (
          await db.simulationRun.findUniqueOrThrow({
            where: { id: run.body.id },
          })
        ).approvalStatus,
      ).toBe("approved");
    },
    30000,
  );
  it("blocks access to another admin’s session", async () => {
    const other = await db.adminUser.create({
      data: {
        email: `other-${Date.now()}@kailor.local`,
        passwordHash: "unusable",
      },
    });
    const subject = await db.subject.create({ data: { name: "Other admin" } });
    const session = await db.discoverySession.create({
      data: {
        adminId: other.id,
        subjectId: subject.id,
        definitionVersion: "1.0.0",
      },
    });
    expect((await client.get(`/api/sessions/${session.id}`)).status).toBe(404);
    await db.discoverySession.delete({ where: { id: session.id } });
    await db.subject.delete({ where: { id: subject.id } });
    await db.adminUser.delete({ where: { id: other.id } });
  });
  it("isolates guest ownership, privileges, references and report export", async () => {
    const guest = request.agent(app),
      otherGuest = request.agent(app);
    const created = await guest
      .post("/api/guest/sessions")
      .set("Origin", origin)
      .send({});
    expect(created.status).toBe(201);
    const guestId = created.body.id;
    guestOwners.push(
      (await db.discoverySession.findUniqueOrThrow({ where: { id: guestId } }))
        .adminId,
    );
    expect(created.body.synthetic).toBe(true);
    expect(created.headers["set-cookie"][0]).toContain("Path=/api/guest");
    expect((await guest.get("/api/cases")).status).toBe(401);
    expect(
      (
        await guest
          .post("/api/simulations")
          .set("Origin", origin)
          .send({ personaId: "kai" })
      ).status,
    ).toBe(401);
    expect((await guest.get(`/api/guest/sessions/${id}`)).status).toBe(404);
    expect(
      (await otherGuest.get(`/api/guest/sessions/${guestId}`)).status,
    ).toBe(401);
    const other = await otherGuest
      .post("/api/guest/sessions")
      .set("Origin", origin)
      .send({});
    guestOwners.push(other.body.adminId);
    expect(
      (await otherGuest.get(`/api/guest/sessions/${guestId}`)).status,
    ).toBe(404);
    const cookie = created.headers["set-cookie"][0]
      .split(";")[0]
      .replace("kailor_guest=", "kailor_session=");
    expect(
      (await request(app).get("/api/cases").set("Cookie", cookie)).status,
    ).toBe(401);
    let current = created.body;
    for (;;) {
      const next = await guest.get(`/api/guest/sessions/${guestId}/next`);
      const q = next.body.question;
      if (!q) break;
      const value = (personas[0].answers as Record<string, unknown>)[q.id];
      const response = await guest
        .put(`/api/guest/sessions/${guestId}/answers`)
        .set("Origin", origin)
        .send({
          revision: current.revision,
          questionId: q.id,
          value: value ?? "",
          skip: value === undefined,
        });
      expect(response.status).toBe(200);
      current = response.body;
    }
    const chat = await guest
      .post(`/api/guest/sessions/${guestId}/chat`)
      .set("Origin", origin)
      .send({ revision: current.revision, message: "What comes next?" });
    expect(chat.body.provider).toBe("mock-development");
    current = chat.body.session;
    const assessment = await guest
      .post(`/api/guest/sessions/${guestId}/assessment`)
      .set("Origin", origin)
      .send({ revision: current.revision });
    expect(assessment.status).toBe(200);
    expect(
      assessment.body.content.matchedCases.every(
        (c: any) => c.sourceType === "seed",
      ),
    ).toBe(true);
    const pdf = await guest.get(`/api/guest/sessions/${guestId}/report.pdf`);
    expect(pdf.body.subarray(0, 5).toString()).toBe("%PDF-");
    const restarted = await guest
      .post("/api/guest/sessions")
      .set("Origin", origin)
      .send({});
    expect(restarted.body.id).not.toBe(guestId);
    expect((await guest.get(`/api/guest/sessions/${guestId}`)).status).toBe(
      200,
    );
    const environment = config.NODE_ENV;
    config.NODE_ENV = "production";
    try {
      expect((await guest.get(`/api/guest/sessions/${guestId}`)).status).toBe(
        404,
      );
    } finally {
      config.NODE_ENV = environment;
    }
  }, 30000);
  it("revokes access on logout", async () => {
    expect(
      (await client.post("/api/auth/logout").set("Origin", origin)).status,
    ).toBe(204);
    expect((await client.get("/api/sessions")).status).toBe(401);
  });
});
