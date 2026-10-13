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
export async function requireAdmin(
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
  const admin = await db.adminUser.findUnique({ where: { email } });
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
  return { email: admin.email };
}
