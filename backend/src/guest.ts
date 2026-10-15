import { planRouter } from "./plan-routes.js";
import { evidenceReviewInput } from "../../shared/src/index.js";
import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "./db.js";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import { tokenHash } from "./auth.js";
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
  if (
    config.NODE_ENV === "production" ||
    !["127.0.0.1", "localhost", "::1"].includes(config.HOST)
  )
    throw new AppError(404, "not_found", "Preview is unavailable");
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
  if (auth && auth.admin.isGuest && auth.expiresAt > new Date())
    res.locals.guestId = auth.adminId;
  next();
});
guestRouter.post(
  "/sessions",
  rateLimit({
    windowMs: 3600000,
    limit: 20,
    message: {
      error: {
        code: "rate_limited",
        message: "Preview creation limit reached. Please return later.",
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
        sameSite: "strict",
        path: "/api/guest",
        maxAge: 86400000,
      });
    }
    res
      .status(201)
      .json(
        await sessions.createSession(owner, "Guest discovery preview", true),
      );
  },
);
guestRouter.use((_req, res, next) => {
  if (!res.locals.guestId)
    throw new AppError(
      401,
      "preview_expired",
      "Your preview has expired. Start a new discovery.",
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
      true,
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
