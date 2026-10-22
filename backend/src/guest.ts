import { discardGuestWork } from "./guest-lifecycle.js";
import { guestJourneys } from "./guest-journeys.js";
import { planRouter } from "./plan-routes.js";
import { evidenceReviewInput } from "../../shared/src/index.js";
import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import { tokenHash, requireAccount } from "./auth.js";
import * as sessions from "./session-service.js";
import {
  evidenceBatchInput,
  answerInput,
  chatInput,
  mutationSchema,
} from "../../shared/src/index.js";
import { renderPdf } from "./pdf.js";
export const guestRouter = Router();
guestRouter.use((_req, res, next) => {
  if (config.GUEST_ACCESS !== "enabled")
    throw new AppError(
      403,
      "guest_unavailable",
      "Guest exploration is unavailable during testing. Please sign in.",
    );
  res.setHeader("Cache-Control", "no-store");
  next();
});
// Never read the founder cookie; guest tokens authenticate only explicitly guest principals.
guestRouter.use(async (req, res, next) => {
  const token =
    req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("kailor_guest="))
      ?.slice(13) ?? "";
  const auth = /^[a-f0-9]{64}$/.test(token)
    ? await db.authSession.findUnique({
        where: { tokenHash: tokenHash(token) },
        include: { admin: true },
      })
    : null;
  if (auth && auth.admin.isGuest && auth.expiresAt > new Date()) {
    res.locals.guestId = auth.adminId;
    res.locals.guestExpiresAt = auth.expiresAt;
    res.locals.guestTokenHash = auth.tokenHash;
  }
  next();
});
// Explicit exit discards only the principal authenticated by the guest cookie.
guestRouter.post("/logout", async (req, res) => {
  z.object({ discard: z.literal(true) })
    .strict()
    .parse(req.body);
  const owner = res.locals.guestId as string | undefined;
  const discardedSessionIds = owner
    ? await discardGuestWork(owner, res.locals.guestTokenHash)
    : [];
  res.clearCookie("kailor_guest", {
    path: "/api/guest",
    httpOnly: true,
    sameSite: "strict",
    secure: config.NODE_ENV === "production",
  });
  res.json({ discardedSessionIds });
});
guestRouter.use(guestJourneys);
guestRouter.post(
  "/sessions",
  rateLimit({
    windowMs: 3600000,
    limit: 20,
    message: {
      error: {
        code: "rate_limited",
        message: "Discovery creation limit reached. Please return later.",
      },
    },
  }),
  async (req, res) => {
    z.object({})
      .strict()
      .parse(req.body ?? {});
    let owner = res.locals.guestId as string | undefined;
    if (!owner) {
      const token = randomBytes(32).toString("hex");
      const admin = await db.adminUser.create({
        data: {
          isGuest: true,
          email: `${randomUUID()}@guest.invalid`,
          passwordHash: "disabled-guest-login",
          sessions: {
            create: {
              tokenHash: tokenHash(token),
              expiresAt: new Date(Date.now() + 86400000),
            },
          },
        },
      });
      owner = admin.id;
      res.cookie("kailor_guest", token, {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/guest",
      });
    }
    res
      .status(201)
      .json(await sessions.createSession(owner, "My project", false, true));
  },
);
// Both independent HTTP-only cookies are required. A logged-in account alone cannot claim a guest project.
guestRouter.post("/transfer", requireAccount, async (req, res) => {
  const input = z
    .object({
      consent: z.literal(true),
      transferKey: z.uuid(),
      planId: z.uuid(),
    })
    .strict()
    .parse(req.body);
  const accountId = String(res.locals.adminId);
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${accountId} FOR UPDATE`;
    const completed = await tx.auditEvent.findFirst({
      where: {
        actorId: accountId,
        action: "guest.transferred",
        entityId: input.planId,
        details: { path: ["transferKey"], equals: input.transferKey },
      },
    });
    if (completed)
      return completed.details as { planId: string; sessionId: string };
    const guestId = res.locals.guestId as string | undefined;
    if (!guestId)
      throw new AppError(
        401,
        "preview_expired",
        "The guest session is no longer available. Transfer requires its active browser session.",
      );
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${guestId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${input.planId} FOR UPDATE`;
    const plan = await tx.plan.findFirst({
      where: { id: input.planId, adminId: guestId, admin: { isGuest: true } },
      include: {
        sessions: {
          select: { id: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });
    const sessionId = plan?.lastSessionId ?? plan?.sessions[0]?.id;
    if (!plan || !sessionId)
      throw new AppError(404, "not_found", "Guest project not found");
    // Existing composite FK has ON UPDATE CASCADE: ownership moves for every conversation atomically.
    await tx.accountSettings.updateMany({
      where: { adminId: guestId },
      data: { activePlanId: null, revision: { increment: 1 } },
    });
    await tx.plan.update({
      where: { id: plan.id },
      data: { adminId: accountId, revision: { increment: 1 } },
    });
    await tx.authSession.deleteMany({ where: { adminId: guestId } });
    const details = {
      transferKey: input.transferKey,
      planId: plan.id,
      sessionId,
    };
    await tx.auditEvent.create({
      data: {
        actorId: accountId,
        action: "guest.transferred",
        entityId: plan.id,
        details,
      },
    });
    return details;
  });
  res.clearCookie("kailor_guest", {
    path: "/api/guest",
    httpOnly: true,
    sameSite: "strict",
    secure: config.NODE_ENV === "production",
  });
  res.json(result);
});
guestRouter.use((_req, res, next) => {
  if (!res.locals.guestId)
    throw new AppError(
      401,
      "preview_expired",
      "Your guest session has expired. Start a new discovery.",
    );
  next();
});
guestRouter.use(planRouter);
const id = z.uuid();
guestRouter.get("/sessions/:id", async (req, res) =>
  res.json(
    await sessions.getSession(id.parse(req.params.id), res.locals.guestId),
  ),
);
guestRouter.get("/sessions/:id/next", async (req, res) =>
  res.json(
    await sessions.nextForSession(id.parse(req.params.id), res.locals.guestId),
  ),
);
guestRouter.put("/sessions/:id/answers", async (req, res) =>
  res.json(
    await sessions.submitAnswer(
      id.parse(req.params.id),
      res.locals.guestId,
      answerInput.parse(req.body),
    ),
  ),
);
guestRouter.post("/sessions/:id/chat", async (req, res) =>
  res.json(
    await sessions.converse(
      id.parse(req.params.id),
      res.locals.guestId,
      chatInput.parse(req.body),
      config.AI_ALLOW_GUEST_REMOTE !== "true",
    ),
  ),
);
guestRouter.post("/sessions/:id/evidence/:evidenceId", async (req, res) => {
  const input = evidenceReviewInput.parse(req.body);
  res.json(
    await sessions.confirmEvidence(
      id.parse(req.params.id),
      res.locals.guestId,
      id.parse(req.params.evidenceId),
      input.revision,
      input.accept,
      input.value,
    ),
  );
});
guestRouter.post("/sessions/:id/evidence", async (req, res) => {
  const input = evidenceBatchInput.parse(req.body);
  res.json(
    await sessions.confirmBatch(
      id.parse(req.params.id),
      res.locals.guestId,
      input.revision,
      input.ids,
      input.accept,
    ),
  );
});
guestRouter.post("/sessions/:id/assessment", async (req, res) =>
  res.json(
    await sessions.assess(
      id.parse(req.params.id),
      res.locals.guestId,
      mutationSchema.strict().parse(req.body).revision,
    ),
  ),
);
guestRouter.get("/sessions/:id/canvas", async (req, res) =>
  res.json(await sessions.canvas(id.parse(req.params.id), res.locals.guestId)),
);
guestRouter.get("/sessions/:id/report", async (req, res) =>
  res.json(
    await sessions.getReport(id.parse(req.params.id), res.locals.guestId),
  ),
);
guestRouter.get("/sessions/:id/report.pdf", async (req, res) => {
  const report = await sessions.getReport(
    id.parse(req.params.id),
    res.locals.guestId,
  );
  res
    .type("application/pdf")
    .attachment("kailor-preview-draft.pdf")
    .send(await renderPdf(report.content));
});
guestRouter.use(() => {
  throw new AppError(404, "not_found", "Preview route not found");
});
