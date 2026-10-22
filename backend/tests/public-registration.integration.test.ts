import { afterAll, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { config } from "../src/config.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Use _test database");
const prefix = `public-${randomUUID()}`;
const password = "synthetic-password-only";
const origin = config.APP_ORIGIN;
const owners: string[] = [];
afterAll(async () => {
  await db.adminUser.deleteMany({ where: { id: { in: owners } } });
  await db.$disconnect();
});
it("registers without an invitation, persists the full name and keeps administration protected", async () => {
  const policy = config.REGISTRATION_POLICY;
  const publicEmail = `${prefix}-public@test.local`;
  const publicClient = request.agent(app);
  try {
    config.REGISTRATION_POLICY = "public"; // Explicit opt-in only.
    expect((await publicClient.get("/api/auth/policy")).body.registration).toBe(
      "public",
    );
    const response = await publicClient
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({ name: "  Test Member  ", email: publicEmail, password })
      .expect(201);
    const account = await db.adminUser.findUniqueOrThrow({
      where: { email: publicEmail },
    });
    owners.push(account.id);
    expect(account.name).toBe("Test Member");
    expect(account.role).toBe("member");
    expect(account.passwordHash).not.toBe(password);
    expect(response.body.name).toBe("Test Member");
    expect((await publicClient.get("/api/auth/me")).body.name).toBe(
      "Test Member",
    );
    await publicClient.get("/api/cases").expect(403);
    await publicClient
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        name: "Test Admin",
        email: `${prefix}-admin@test.local`,
        password,
        role: "admin",
      })
      .expect(400);
    await publicClient
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({ name: " ", email: `${prefix}-empty@test.local`, password })
      .expect(400);
    config.REGISTRATION_POLICY = "closed";
    await publicClient
      .post("/api/auth/register")
      .set("Origin", origin)
      .send({
        name: "Test Closed",
        email: `${prefix}-closed@test.local`,
        password,
      })
      .expect(403);
    expect(
      await db.adminUser.findUnique({
        where: { email: `${prefix}-closed@test.local` },
      }),
    ).toBeNull();
  } finally {
    config.REGISTRATION_POLICY = policy;
  }
});
