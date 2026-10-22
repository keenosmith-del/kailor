import { afterEach, expect, it, vi } from "vitest";
import request from "supertest";
vi.mock("../src/db.js", () => ({
  db: {
    $transaction: vi.fn(),
    adminUser: { findFirst: vi.fn() },
    authSession: { deleteMany: vi.fn(), create: vi.fn() },
  },
}));
import { db } from "../src/db.js";
import { app } from "../src/app.js";
import { config } from "../src/config.js";
import { hashPassword, register, tokenHash } from "../src/auth.js";
const original = {
  policy: config.REGISTRATION_POLICY,
  guest: config.GUEST_ACCESS,
  mode: config.NODE_ENV,
};
afterEach(() => {
  config.REGISTRATION_POLICY = original.policy;
  config.GUEST_ACCESS = original.guest;
  config.NODE_ENV = original.mode;
  vi.clearAllMocks();
});
it("reports the real invite policy and blocks a direct POST without a code before touching the database", async () => {
  config.REGISTRATION_POLICY = "invite";
  expect((await request(app).get("/api/auth/policy")).body.registration).toBe(
    "invite",
  );
  await request(app)
    .post("/api/auth/register")
    .set("Origin", config.APP_ORIGIN)
    .send({ email: "testing@example.com", password: "test-password-only" })
    .expect(403);
  expect(db.$transaction).not.toHaveBeenCalled();
});
it("closed rejects direct registration even with an invitation", async () => {
  config.REGISTRATION_POLICY = "closed";
  await request(app)
    .post("/api/auth/register")
    .set("Origin", config.APP_ORIGIN)
    .send({
      email: "testing@example.com",
      password: "test-password-only",
      invite: "code",
    })
    .expect(403);
  expect(db.$transaction).not.toHaveBeenCalled();
});
it("invitation redemption binds the normalized email, unused token and future expiry in the account transaction", async () => {
  config.REGISTRATION_POLICY = "invite";
  const updateMany = vi.fn().mockResolvedValue({ count: 0 });
  const create = vi.fn();
  vi.mocked(db.$transaction).mockImplementation(async (fn: any) =>
    fn({ accountInvite: { updateMany }, adminUser: { create } }),
  );
  await expect(
    register(" TESTING@example.com ", "test-password-only", "code", {} as any),
  ).rejects.toMatchObject({ code: "registration_unavailable" });
  expect(updateMany).toHaveBeenCalledWith({
    where: {
      tokenHash: tokenHash("code"),
      email: "testing@example.com",
      usedAt: null,
      expiresAt: { gt: expect.any(Date) },
    },
    data: { usedAt: expect.any(Date) },
  });
  expect(create).not.toHaveBeenCalled();
});
it("explicit public policy creates only a member and existing approved users can sign in under closed policy", async () => {
  config.REGISTRATION_POLICY = "public";
  const create = vi.fn();
  vi.mocked(db.$transaction).mockImplementation(async (fn: any) =>
    fn({ adminUser: { create } }),
  );
  vi.mocked(db.adminUser.findFirst).mockResolvedValue({
    id: "test",
    email: "testing@example.com",
    role: "member",
    name: "Test",
    isGuest: false,
    passwordHash: await hashPassword("test-password-only"),
  } as any);
  await register(
    "testing@example.com",
    "test-password-only",
    "",
    { cookie: vi.fn() } as any,
    "Test",
  );
  expect(create).toHaveBeenCalledWith({
    data: {
      email: "testing@example.com",
      passwordHash: expect.any(String),
      role: "member",
      name: "Test",
    },
  });
  config.REGISTRATION_POLICY = "closed";
  const response = await request(app)
    .post("/api/auth/login")
    .set("Origin", config.APP_ORIGIN)
    .send({ email: "testing@example.com", password: "test-password-only" })
    .expect(200);
  expect(response.body.role).toBe("member");
  expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
});
it("production guest and preview API paths cannot allocate principals by default", async () => {
  config.NODE_ENV = "production";
  config.GUEST_ACCESS = undefined;
  await request(app)
    .post("/api/guest/sessions")
    .set("Origin", config.APP_ORIGIN)
    .send({})
    .expect(403);
  await request(app)
    .post("/api/guest/journeys")
    .set("Origin", config.APP_ORIGIN)
    .send({})
    .expect(403);
  config.GUEST_ACCESS = "disabled";
  config.NODE_ENV = "development";
  await request(app).get("/api/guest/journeys").expect(403);
});
