import { planRouter } from "./plan-routes.js";
import { evidenceReviewInput } from "../../shared/src/index.js";
import { containsSensitiveData } from "./conversation-guidance.js";
import { evaluateInput } from "./input-quality.js";
import { evaluateReadiness } from "./discovery-readiness.js";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z, ZodError } from "zod";
import { randomUUID, randomBytes } from "node:crypto";
import { db } from "./db.js";
import { config, logger } from "./config.js";
import { AppError } from "./errors.js";
import {
  authCookie,
  cookieToken,
  login,
  requireAdmin,
  requireAccount,
  register,
  sameOrigin,
  tokenHash,
} from "./auth.js";
import {
  evidenceBatchInput,
  answerInput,
  chatInput,
  mutationSchema,
} from "../../shared/src/index.js";
import { questions, version } from "./discovery.js";
import { personas, matchCases, personaSchema } from "./library.js";
import * as sessions from "./session-service.js";
import { guestRouter } from "./guest.js";
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
    stage: z.string().max(100).optional(),
    scope: z.array(z.string().max(100)).max(20).optional(),
    limitations: z.array(z.string().max(300)).max(10).optional(),
    unsuitableConditions: z
      .array(z.string().min(1).max(300))
      .max(10)
      .optional(),
    followUpDimensions: z
      .array(
        z.enum([
          "offlineDetails",
          "dataCaptureDetails",
          "accessDetails",
          "reportingDetails",
          "integrationDetails",
          "bookingCapabilities",
          "websiteContent",
          "currentAlternatives",
          "firstVersion",
          "orderWorkflow",
        ]),
      )
      .max(9)
      .optional(),
    approaches: z
      .array(
        z
          .object({
            serviceId: z.string().min(1).max(100),
            title: z.string().min(1).max(200),
            rationale: z.string().min(1).max(500),
            dependencies: z
              .array(z.string().min(1).max(300))
              .max(10)
              .optional(),
            unsuitableWhen: z
              .array(
                z.enum([
                  "websiteStatus",
                  "bookingStatus",
                  "aiPreference",
                  "automationPreference",
                  "websitePreference",
                  "appPreference",
                ]),
              )
              .max(6)
              .optional(),
          })
          .strict(),
      )
      .max(10)
      .optional(),
    unsuitableConstraints: z
      .array(z.string().min(1).max(100))
      .max(20)
      .optional(),
  })
  .strict();
export const app = express();
app.disable("x-powered-by");
// Trust only the local reverse proxy, and only when explicitly configured.
app.set("trust proxy", config.TRUST_PROXY === "loopback" ? "loopback" : false);
app.use(helmet());
app.use(express.json({ limit: "128kb" }));
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
  res.setHeader("Cache-Control", "no-store");
  await db.$queryRaw`SELECT 1`;
  res.json({ status: "ok", service: "kailor", definitionVersion: version });
});
app.use(
  "/api",
  sameOrigin,
  (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  },
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
app.get("/api/auth/policy", (_req, res) =>
  res.json({
    registration: config.REGISTRATION_POLICY,
    guestAccess: config.GUEST_ACCESS === "enabled",
  }),
);
app.post(
  "/api/auth/register",
  rateLimit({ windowMs: 15 * 60_000, limit: 10 }),
  async (req, res) => {
    const input = z
      .object({
        email: z.email().max(254),
        password: z.string().min(12).max(128),
        name: z.string().trim().min(2).max(150).optional(),
        invite: z.string().max(256).default(""),
      })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await register(
          input.email,
          input.password,
          input.invite,
          res,
          input.name,
        ),
      );
  },
);
app.use("/api/guest", guestRouter);
app.use("/api", requireAccount, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", planRouter);
app.get("/api/auth/me", async (_req, res) => {
  const admin = await db.adminUser.findUniqueOrThrow({
    where: { id: res.locals.adminId },
  });
  res.json({ email: admin.email, role: admin.role, name: admin.name });
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
app.post("/api/sessions/entry", async (req, res) => {
  z.object({})
    .strict()
    .parse(req.body ?? {});
  res.json(
    await sessions.createSession(
      String(res.locals.adminId),
      "New project",
      false,
      true,
    ),
  );
});
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
  const input = evidenceReviewInput.parse(req.body);
  res.json(
    await sessions.confirmEvidence(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      idSchema.parse(req.params.evidenceId),
      input.revision,
      input.accept,
      input.value,
    ),
  );
});
app.post("/api/sessions/:id/evidence", async (req, res) => {
  const input = evidenceBatchInput.parse(req.body);
  res.json(
    await sessions.confirmBatch(
      idSchema.parse(req.params.id),
      res.locals.adminId,
      input.revision,
      input.ids,
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
app.use(
  [
    "/api/scenarios",
    "/api/personas",
    "/api/simulations",
    "/api/cases",
    "/api/auth/invites",
  ],
  requireAdmin,
);
app.post("/api/auth/invites", async (req, res) => {
  const { email } = z
    .object({ email: z.email().max(254) })
    .strict()
    .parse(req.body);
  const token = randomBytes(32).toString("hex");
  await db.accountInvite.create({
    data: {
      tokenHash: tokenHash(token),
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      createdBy: res.locals.adminId,
    },
  });
  res.status(201).json({ invite: token, expiresInDays: 7 });
});
app.get("/api/scenarios", async (_req, res) =>
  res.json(await db.scenarioTemplate.findMany({ orderBy: { title: "asc" } })),
);
app.get("/api/personas", (_req, res) => res.json(personas));
app.post("/api/simulations", async (req, res) => {
  const input = z
    .union([
      z.object({ personaId: z.string().min(1).max(100) }).strict(),
      z.object({ persona: personaSchema }).strict(),
    ])
    .parse(req.body);
  const definition = "persona" in input ? input.persona : undefined;
  res
    .status(201)
    .json(
      await sessions.simulate(
        res.locals.adminId,
        definition?.id ?? ("personaId" in input ? input.personaId : ""),
        definition,
      ),
    );
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
app.get("/api/simulations/:id", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const run = await db.simulationRun.findFirst({
    where: { id, session: { adminId: res.locals.adminId } },
  });
  if (!run) throw new AppError(404, "not_found", "Simulation not found");
  const snapshot = run.assessmentId
    ? await db.reportSnapshot.findUnique({
        where: { assessmentId: run.assessmentId },
      })
    : null;
  res.json({ ...run, report: snapshot?.content ?? null });
});
app.put("/api/simulations/:id/evaluation", async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const evaluation = z
    .object({
      notes: z.string().min(10).max(2000),
      omissions: z.array(z.string().max(300)).max(20),
      incorrectAssumptions: z.array(z.string().max(300)).max(20),
      verdict: z.enum(["acceptable", "needs_revision", "rejected"]),
    })
    .strict()
    .parse(req.body);
  const run = await db.simulationRun.findFirst({
    where: { id, session: { adminId: res.locals.adminId } },
  });
  if (!run) throw new AppError(404, "not_found", "Simulation not found");
  let automated = run.evaluationNotes;
  try {
    const prior = JSON.parse(automated);
    if (typeof prior.automated === "string") automated = prior.automated;
  } catch {
    /* Initial automated notes are plain text. */
  }
  const updated = await db.$transaction(async (tx) => {
    const result = await tx.simulationRun.update({
      where: { id },
      data: {
        evaluationNotes: JSON.stringify({
          automated,
          review: evaluation,
        }),
      },
    });
    await tx.auditEvent.create({
      data: {
        actorId: res.locals.adminId,
        action: "simulation.evaluated",
        entityId: id,
        details: { verdict: evaluation.verdict },
      },
    });
    return result;
  });
  res.json(updated);
});
app.get("/api/cases", async (req, res) => {
  if (req.query.sessionId) {
    const s = await sessions.getSession(
      idSchema.parse(req.query.sessionId),
      res.locals.adminId,
    );
    res.json(
      matchCases(
        sessions.answersOf(s),
        await sessions.referenceCases(),
        s.evidence as unknown as import("../../shared/src/index.js").Evidence[],
        sessions.statesOf(s),
      ),
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
      reviewVersion: z.number().int().nonnegative().optional(),
      pattern: patternSchema,
    })
    .strict()
    .parse(req.body);
  const record = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CaseIntelligenceRecord" WHERE id = ${id} FOR UPDATE`;
    const c = await tx.caseIntelligenceRecord.findUnique({ where: { id } });
    if (!c) throw new AppError(404, "not_found", "Case not found");
    if (
      input.reviewVersion !== undefined &&
      input.reviewVersion !== c.reviewVersion
    )
      throw new AppError(
        409,
        "case_revision_conflict",
        "This case was reviewed elsewhere. Reload before editing.",
      );
    if (input.status === "approved") {
      if (
        containsSensitiveData(
          JSON.stringify({ title: input.title, pattern: input.pattern }),
        )
      )
        throw new AppError(
          422,
          "case_sensitive_data",
          "Remove identifying or sensitive data from the reusable pattern before approval",
        );
      const quality = evaluateInput(input.title, "caseTitle");
      const industryQuality = evaluateInput(input.pattern.industry, "industry");
      if (
        !quality.usableFacts ||
        !industryQuality.usableFacts ||
        !input.pattern.patterns.length ||
        (!input.pattern.problems.length &&
          !input.pattern.goals.length &&
          !input.pattern.scope?.length)
      )
        throw new AppError(
          422,
          "case_quality",
          "Reusable knowledge needs a meaningful pattern and supported objective, not placeholder content",
        );
      const knownServices = await tx.service.count({
        where: { id: { in: input.pattern.patterns } },
      });
      if (knownServices !== new Set(input.pattern.patterns).size)
        throw new AppError(
          422,
          "case_unsupported_pattern",
          "Unknown delivery capabilities cannot be approved as established services",
        );
      if (
        input.pattern.approaches?.some(
          (a) => !input.pattern.patterns.includes(a.serviceId),
        )
      )
        throw new AppError(
          422,
          "case_unsupported_pattern",
          "Approach services must be supported by the reusable pattern and source assessment",
        );
      for (const factor of [
        ...input.pattern.problems,
        ...input.pattern.goals,
        ...input.pattern.tools,
        ...(input.pattern.constraints ?? []),
        ...(input.pattern.scope ?? []),
      ])
        if (!evaluateInput(factor, "caseFactor").usableFacts)
          throw new AppError(
            422,
            "case_quality",
            "A reusable matching factor contains placeholder or ambiguous information",
          );
      if (c.sourceRunId) {
        const run = await tx.simulationRun.findUniqueOrThrow({
          where: { id: c.sourceRunId },
          include: { session: { include: { answers: true, evidence: true } } },
        });
        if (
          !run.assessmentId ||
          !evaluateReadiness(
            sessions.answersOf(run.session),
            run.session
              .evidence as unknown as import("../../shared/src/index.js").Evidence[],
            sessions.statesOf(run.session),
          ).canAssess
        )
          throw new AppError(
            422,
            "case_insufficient_evidence",
            "This source run has insufficient or conflicting evidence; it cannot be approved for reuse",
          );
        const snapshot = await tx.reportSnapshot.findUnique({
          where: { assessmentId: run.assessmentId },
        });
        const supported =
          (
            snapshot?.content as unknown as
              | import("../../shared/src/index.js").Report
              | undefined
          )?.recommendations.map((r) => r.serviceId) ?? [];
        if (
          !supported.length ||
          input.pattern.patterns.some((id) => !supported.includes(id))
        )
          throw new AppError(
            422,
            "case_unsupported_pattern",
            "A reusable pattern cannot claim services unsupported by its source assessment",
          );
      }
    }
    await tx.auditEvent.create({
      data: {
        actorId: res.locals.adminId,
        action: "case.review-history",
        entityId: id,
        details: sessions.json({
          version: c.reviewVersion,
          title: c.title,
          reviewStatus: c.reviewStatus,
          pattern: c.pattern,
          reviewNotes: c.reviewNotes,
        }),
      },
    });
    const updated = await tx.caseIntelligenceRecord.update({
      where: { id },
      data: {
        reviewStatus: input.status,
        reviewNotes: input.notes,
        title: input.title,
        pattern: sessions.json(input.pattern),
        reviewedAt: new Date(),
        reviewVersion: { increment: 1 },
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
        ...(error instanceof AppError && error.details
          ? { details: error.details }
          : {}),
        requestId: res.locals.requestId,
      },
    });
  },
);
