import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";
import { version } from "./discovery.js";
import { AppError } from "./errors.js";

export const guestJourneys = Router();
// Reading the entry screen never creates a principal, renews access or changes selection.
guestJourneys.get("/journeys", async (_req, res) => {
  const adminId = res.locals.guestId as string | undefined;
  const current = adminId
    ? await db.plan.findFirst({
        where: { adminId, archivedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, revision: true, lastSessionId: true },
      })
    : null;
  res.json({ current, expiresAt: res.locals.guestExpiresAt ?? null });
});
guestJourneys.post(
  "/journeys",
  rateLimit({ windowMs: 3600000, limit: 10 }),
  async (req, res) => {
    const input = z
      .object({
        planId: z.uuid(),
        revision: z.number().int().nonnegative(),
        creationKey: z.uuid(),
        consent: z.literal(true),
      })
      .strict()
      .parse(req.body);
    const adminId = res.locals.guestId as string | undefined;
    if (!adminId)
      throw new AppError(
        401,
        "preview_expired",
        "Your guest session has expired. Start a new discovery.",
      );
    const result = await db.$transaction(async (tx) => {
      // Same owner-first lock order as selection, new conversations and account transfer.
      await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
      const auth = await tx.authSession.findFirst({
        where: {
          tokenHash: res.locals.guestTokenHash,
          adminId,
          admin: { isGuest: true },
          expiresAt: { gt: new Date() },
        },
      });
      if (!auth)
        throw new AppError(
          401,
          "preview_expired",
          "Your guest session has expired.",
        );
      const completed = await tx.auditEvent.findFirst({
        where: {
          actorId: adminId,
          action: "guest.journey-started",
          details: { path: ["creationKey"], equals: input.creationKey },
        },
      });
      if (completed) {
        const details = completed.details as {
          previousPlanId: string;
          planId: string;
          sessionId: string;
        };
        if (details.previousPlanId !== input.planId)
          throw new AppError(
            409,
            "idempotency_conflict",
            "This request belongs to another guest journey.",
          );
        return { planId: details.planId, sessionId: details.sessionId };
      }
      await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${input.planId} FOR UPDATE`;
      const previous = await tx.plan.findFirst({
        where: { id: input.planId, adminId },
      });
      if (!previous)
        throw new AppError(404, "not_found", "Guest project not found");
      if (previous.archivedAt || previous.revision !== input.revision)
        throw new AppError(
          409,
          "revision_conflict",
          "Your project changed. Reload this page before starting a new journey.",
        );
      await tx.plan.updateMany({
        where: { adminId, archivedAt: null },
        data: { archivedAt: new Date(), revision: { increment: 1 } },
      });
      const plan = await tx.plan.create({
        data: { adminId, title: "My project", creationKey: input.creationKey },
      });
      const session = await tx.discoverySession.create({
        data: {
          admin: { connect: { id: adminId } },
          plan: { connect: { id_adminId: { id: plan.id, adminId } } },
          definitionVersion: version,
          subject: { create: { name: plan.title } },
        },
      });
      await tx.plan.update({
        where: { id: plan.id },
        data: { lastSessionId: session.id },
      });
      await tx.accountSettings.upsert({
        where: { adminId },
        create: { adminId, activePlanId: plan.id },
        update: { activePlanId: plan.id, revision: { increment: 1 } },
      });
      const details = {
        creationKey: input.creationKey,
        previousPlanId: previous.id,
        planId: plan.id,
        sessionId: session.id,
      };
      await tx.auditEvent.create({
        data: {
          actorId: adminId,
          action: "guest.journey-started",
          entityId: plan.id,
          details,
        },
      });
      return { planId: plan.id, sessionId: session.id };
    });
    res.status(201).json(result);
  },
);
