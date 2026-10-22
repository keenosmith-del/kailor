import {
  scrypt as scryptCallback,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { config } from "./config.js";
import { AppError } from "./errors.js";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, hex] = encoded.split(":");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function cookieToken(req: Request) {
  return (
    req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("kailor_session="))
      ?.slice("kailor_session=".length) ?? ""
  );
}
export function authCookie(
  res: Response,
  token: string,
  maxAge = 8 * 60 * 60 * 1000,
) {
  res.cookie("kailor_session", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api",
    maxAge,
  });
}
export async function requireAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = cookieToken(req);
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new AppError(401, "unauthorized", "Sign in to continue");
  const auth = await db.authSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { admin: true },
  });
  if (!auth || auth.admin.isGuest || auth.expiresAt <= new Date())
    throw new AppError(401, "unauthorized", "Your session has expired");
  res.locals.adminId = auth.adminId;
  res.locals.role = auth.admin.role;
  next();
}
export function sameOrigin(req: Request, _res: Response, next: NextFunction) {
  const allowed = new Set([new URL(config.APP_ORIGIN).origin]);
  if (config.NODE_ENV !== "production") {
    const configured = new URL(config.APP_ORIGIN);
    if (["localhost", "127.0.0.1", "[::1]"].includes(configured.hostname)) {
      for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
        const local = new URL(configured);
        local.hostname = host;
        allowed.add(local.origin);
      }
    }
  }
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    !allowed.has(req.headers.origin ?? "")
  )
    throw new AppError(403, "origin_rejected", "Request origin is not allowed");
  next();
}
export async function login(email: string, password: string, res: Response) {
  const admin = await db.adminUser.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });
  const dummy = "00000000000000000000000000000000:" + "0".repeat(128);
  const valid = await verifyPassword(
    password,
    admin && !admin.isGuest ? admin.passwordHash : dummy,
  );
  if (!admin || admin.isGuest || !valid)
    throw new AppError(
      401,
      "invalid_credentials",
      "Email or password is incorrect",
    );
  const token = randomBytes(32).toString("hex");
  await db.authSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.authSession.create({
    data: {
      tokenHash: tokenHash(token),
      adminId: admin.id,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  authCookie(res, token);
  return { email: admin.email, role: admin.role, name: admin.name };
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  if (res.locals.role !== "admin")
    throw new AppError(403, "forbidden", "Founder access is required");
  next();
}
export function assertRegistrationAllowed(
  policy: "closed" | "invite" | "public",
  invite: string,
) {
  if (policy === "closed" || (policy === "invite" && !invite.trim()))
    throw new AppError(
      403,
      "registration_unavailable",
      "Account creation is restricted during testing. Contact keenosmith@kailor.co.za.",
    );
}

export async function register(
  email: string,
  password: string,
  invite: string,
  res: Response,
  name?: string,
) {
  assertRegistrationAllowed(config.REGISTRATION_POLICY, invite);
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  try {
    await db.$transaction(async (tx) => {
      if (config.REGISTRATION_POLICY === "closed") throw new Error("closed");
      // Email ownership, expiry and single use are checked atomically. A failed
      // account creation rolls back consumption; concurrent redemption has one winner.
      if (invite) {
        const result = await tx.accountInvite.updateMany({
          where: {
            tokenHash: tokenHash(invite),
            email: normalized,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        });
        if (result.count !== 1) throw new Error("invite");
      }
      await tx.adminUser.create({
        data: { email: normalized, passwordHash, role: "member", name },
      });
    });
  } catch {
    throw new AppError(
      400,
      "registration_unavailable",
      "Account could not be created. Check your details or try signing in.",
    );
  }
  return login(normalized, password, res);
}
