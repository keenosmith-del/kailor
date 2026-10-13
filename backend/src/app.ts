import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z, ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { logger } from "./config.js";
import { AppError } from "./errors.js";
import {
  authCookie,
  cookieToken,
  login,
  requireAdmin,
  sameOrigin,
  tokenHash,
} from "./auth.js";
import {
  answerInput,
  chatInput,
  mutationSchema,
} from "../../shared/src/index.js";
import { questions, version } from "./discovery.js";
import { personas, matchCases } from "./library.js";
import * as sessions from "./session-service.js";
import { renderPdf } from "./pdf.js";
const idSchema = z.uuid();
const patternSchema = z
  .object({
    industry: z.string().min(1).max(200),
    problems: z.array(z.string().max(100)).max(20),
    tools: z.array(z.string().max(100)).max(20),
    goals: z.array(z.string().max(100)).max(20),
    patterns: z.array(z.string().max(100)).max(20),
    discoveryQuestions: z.array(z.string().max(300)).max(10).optional(),
    constraints: z.array(z.string().max(100)).max(20).optional(),
  })
  .strict();
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  res.on("finish", () =>
    logger.info("http", {
      requestId,
      method: req.method,
      status: res.statusCode,
    }),
  );
  next();
});
app.get("/api/health", async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ status: "ok", service: "kailor", definitionVersion: version });
});
app.use(
  "/api",
  sameOrigin,
  rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "rate_limited",
        message: "Too many requests. Try again shortly.",
      },
    },
  }),
);
app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    message: {
      error: {
        code: "rate_limited",
        message: "Too many sign-in attempts. Try again later.",
      },
    },
  }),
  async (req, res) => {
    const input = z
      .object({ email: z.email(), password: z.string().min(1).max(256) })
      .strict()
      .parse(req.body);
    res.json(await login(input.email, input.password, res));
  },
);
app.use("/api", requireAdmin, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.get("/api/auth/me", async (_req, res) => {
  const admin = await db.adminUser.findUniqueOrThrow({
    where: { id: res.locals.adminId },
  });
  res.json({ email: admin.email });
});
app.post("/api/auth/logout", async (req, res) => {
  await db.authSession.deleteMany({
    where: { tokenHash: tokenHash(cookieToken(req)) },
  });
  authCookie(res, "", 0);
  res.status(204).end();
});
app.get("/api/discovery", (_req, res) => res.json({ version, questions }));
app.get("/api/sessions", async (_req, res) =>
  res.json(
    await db.discoverySession.findMany({
      where: { adminId: res.locals.adminId },
      include: { subject: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ),
);
app.post("/api/sessions", async (req, res) => {
  const input = z
    .object({ name: z.string().trim().min(1).max(150) })
    .strict()
    .parse(req.body);
  res
    .status(201)
    .json(await sessions.createSession(res.locals.adminId, input.name));
});
app.get("/api/sessions/:id", async (req, res) =>
  res.json(
    await sessions.getSession(
      idSchema.parse(req.params.id),
      res.locals.adminId,
    ),
  ),
);
app.put("/api/sessions/:id/answers", async (req, res) =>
  res.json(
    await sessions.submitAnswer(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      answerInput.parse(req.body),
    ),
  ),
);
app.get("/api/sessions/:id/next", async (req, res) =>
  res.json(
    await sessions.nextForSession(
      idSchema.parse(req.params.id),
      res.locals.adminId,
    ),
  ),
);
app.post("/api/sessions/:id/chat", async (req, res) =>
  res.json(
    await sessions.converse(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      chatInput.parse(req.body),
    ),
  ),
);
app.post("/api/sessions/:id/evidence/:evidenceId", async (req, res) => {
  const input = mutationSchema
    .extend({ accept: z.boolean() })
    .strict()
    .parse(req.body);
  res.json(
    await sessions.confirmEvidence(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      idSchema.parse(req.params.evidenceId),
      input.revision,
      input.accept,
    ),
  );
});
app.post("/api/sessions/:id/assessment", async (req, res) =>
  res.json(
    await sessions.assess(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      mutationSchema.strict().parse(req.body).revision,
    ),
  ),
);
app.get("/api/sessions/:id/canvas", async (req, res) =>
  res.json(
    await sessions.canvas(idSchema.parse(req.params.id), res.locals.adminId),
  ),
);
app.get("/api/sessions/:id/report", async (req, res) =>
  res.json(
    await sessions.getReport(idSchema.parse(req.params.id), res.locals.adminId),
  ),
);
app.get("/api/sessions/:id/report.pdf", async (req, res) => {
  const report = await sessions.getReport(
    idSchema.parse(req.params.id),
    res.locals.adminId,
  );
  res
    .type("application/pdf")
    .attachment("kailor-analysis-draft.pdf")
    .send(await renderPdf(report.content));
});
app.get("/api/scenarios", async (_req, res) =>
  res.json(await db.scenarioTemplate.findMany({ orderBy: { title: "asc" } })),
);
app.get("/api/personas", (_req, res) => res.json(personas));
app.post("/api/simulations", async (req, res) => {
  const input = z
    .object({ personaId: z.string().max(100) })
    .strict()
    .parse(req.body);
  res
    .status(201)
    .json(await sessions.simulate(res.locals.adminId, input.personaId));
});
app.get("/api/simulations", async (_req, res) =>
  res.json(
    await db.simulationRun.findMany({
      where: { session: { adminId: res.locals.adminId } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ),
);
app.get("/api/cases", async (req, res) => {
  if (req.query.sessionId) {
    const s = await sessions.getSession(
      idSchema.parse(req.query.sessionId),
      res.locals.adminId,
    );
    res.json(
      matchCases(sessions.answersOf(s), await sessions.referenceCases()),
    );
  } else
    res.json(
      await db.caseIntelligenceRecord.findMany({
        orderBy: { createdAt: "desc" },
      }),
    );
});
app.put("/api/cases/:id/review", async (req, res) => {
  const id = z.string().max(100).parse(req.params.id);
  const input = z
    .object({
      status: z.enum(["approved", "rejected"]),
      notes: z.string().trim().min(10).max(2000),
      title: z.string().trim().min(1).max(150),
      pattern: patternSchema,
    })
    .strict()
    .parse(req.body);
  const record = await db.$transaction(async (tx) => {
    const c = await tx.caseIntelligenceRecord.findUnique({ where: { id } });
    if (!c) throw new AppError(404, "not_found", "Case not found");
    const updated = await tx.caseIntelligenceRecord.update({
      where: { id },
      data: {
        reviewStatus: input.status,
        reviewNotes: input.notes,
        title: input.title,
        pattern: sessions.json(input.pattern),
        reviewedAt: new Date(),
      },
    });
    if (c.sourceRunId)
      await tx.simulationRun.update({
        where: { id: c.sourceRunId },
        data: { approvalStatus: input.status },
      });
    await tx.auditEvent.create({
      data: {
        actorId: res.locals.adminId,
        action: "case.reviewed",
        entityId: id,
        details: { status: input.status, sourceType: c.sourceType },
      },
    });
    return updated;
  });
  res.json(record);
});
app.use((_req, _res, next) =>
  next(new AppError(404, "not_found", "Route not found")),
);
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const invalid = error instanceof ZodError;
    const bodyError = error instanceof SyntaxError && "body" in error;
    const tooLarge =
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large";
    const status =
      error instanceof AppError
        ? error.status
        : invalid || bodyError
          ? 400
          : tooLarge
            ? 413
            : 500;
    logger.error("request.failed", { requestId: res.locals.requestId, status });
    res.status(status).json({
      error: {
        code:
          error instanceof AppError
            ? error.code
            : status < 500
              ? "validation_error"
              : "internal_error",
        message:
          error instanceof AppError
            ? error.message
            : status < 500
              ? "Please check your request."
              : "Something went wrong. Please try again.",
        ...(invalid
          ? {
              issues: error.issues.map((i) => ({
                path: i.path,
                message: i.message,
              })),
            }
          : {}),
        requestId: res.locals.requestId,
      },
    });
  },
);
