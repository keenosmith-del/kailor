import { remoteEnabled } from "./ai.js";
import { config } from "./config.js";
import { sourceRouter } from "./source-routes.js";
import { customerReport, reportSummary } from "../../shared/src/report.js";
import { Router } from "express";
import { z } from "zod";
import { clearConversation, restartDiscovery } from "./session-service.js";
import * as plans from "./plan-service.js";
import { db } from "./db.js";
import { AppError } from "./errors.js";
import { renderPdf } from "./pdf.js";
import type { Report } from "../../shared/src/index.js";
import {
  planCreateInput,
  planUpdateInput,
  mutationSchema,
} from "../../shared/src/index.js";
export const planRouter = Router();
planRouter.use(sourceRouter);
const id = z.uuid();
const owner = (res: { locals: Record<string, any> }) =>
  String(res.locals.adminId ?? res.locals.guestId);
planRouter.get("/plans", async (req, res) => {
  const query = z
    .object({
      archived: z.enum(["true", "false"]).optional(),
      cursor: id.optional(),
    })
    .strict()
    .parse(req.query);
  res.json(
    await plans.listPlans(owner(res), query.archived === "true", query.cursor),
  );
});
planRouter.post("/plans", async (req, res) =>
  res
    .status(201)
    .json(await plans.createPlan(owner(res), planCreateInput.parse(req.body))),
);
planRouter.post("/plans/compare", async (req, res) => {
  const input = z
    .object({
      planIds: z
        .array(id)
        .length(2)
        .refine((ids) => new Set(ids).size === 2),
    })
    .strict()
    .parse(req.body);
  res.json(await plans.comparePlans(owner(res), input.planIds));
});
planRouter.get("/plans/:id", async (req, res) => {
  const p = await plans.ownedPlan(id.parse(req.params.id), owner(res));
  const { adminId, creationKey, ...publicPlan } = p;
  res.json(publicPlan);
});
planRouter.patch("/plans/:id", async (req, res) =>
  res.json(
    await plans.updatePlan(
      id.parse(req.params.id),
      owner(res),
      planUpdateInput.parse(req.body),
    ),
  ),
);
planRouter.post("/plans/:id/select", async (req, res) => {
  const input = mutationSchema
    .extend({ sessionId: id.optional() })
    .strict()
    .parse(req.body);
  res.json(
    await plans.selectPlan(
      id.parse(req.params.id),
      owner(res),
      input.revision,
      input.sessionId,
    ),
  );
});
planRouter.get("/plans/:id/understanding", async (req, res) => {
  const query = z
    .object({ sessionId: id.optional() })
    .strict()
    .parse(req.query);
  res.json(
    await plans.understanding(
      id.parse(req.params.id),
      owner(res),
      query.sessionId,
    ),
  );
});
planRouter.get("/plans/:id/sessions", async (req, res) => {
  const planId = id.parse(req.params.id);
  await plans.ownedPlan(planId, owner(res));
  const query = z.object({ cursor: id.optional() }).strict().parse(req.query);
  const rows = await db.discoverySession.findMany({
    where: {
      planId,
      adminId: owner(res),
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
    },
    select: {
      id: true,
      updatedAt: true,
      knowledgeRevision: true,
      synthetic: true,
    },
    orderBy: { id: "asc" },
    take: 21,
  });
  res.json({
    sessions: rows.slice(0, 20),
    nextCursor: rows.length > 20 ? rows[19].id : null,
  });
});
planRouter.post("/plans/:id/sessions", async (req, res) => {
  const input = mutationSchema
    .extend({ creationKey: id, carryContext: z.boolean().optional() })
    .strict()
    .parse(req.body);
  res
    .status(201)
    .json(
      await plans.newDiscovery(
        id.parse(req.params.id),
        owner(res),
        input.revision,
        input.creationKey,
        input.carryContext,
      ),
    );
});
planRouter.get("/plans/:id/reports", async (req, res) => {
  const planId = id.parse(req.params.id);
  await plans.ownedPlan(planId, owner(res));
  const query = z.object({ cursor: id.optional() }).strict().parse(req.query);
  const reports = await db.reportSnapshot.findMany({
    where: {
      assessment: { session: { planId, adminId: owner(res) } },
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
    },
    select: {
      id: true,
      createdAt: true,
      content: true,
      assessment: {
        select: { sessionId: true, summary: true, knowledgeRevision: true },
      },
    },
    orderBy: { id: "asc" },
    take: 21,
  });
  res.json({
    reports: reports.slice(0, 20).map(({ content, ...row }) => {
      const report = customerReport(content as unknown as Report);
      return {
        ...row,
        title: report.title,
        assessmentType: report.assessmentType ?? "business",
        status: report.status,
        summary: reportSummary(report),
      };
    }),
    nextCursor: reports.length > 20 ? reports[19].id : null,
  });
});
planRouter.get("/plans/:id/reports/:reportId/pdf", async (req, res) => {
  const report = await db.reportSnapshot.findFirst({
    where: {
      id: id.parse(req.params.reportId),
      assessment: {
        session: { planId: id.parse(req.params.id), adminId: owner(res) },
      },
    },
  });
  if (!report) throw new AppError(404, "not_found", "Report not found");
  res
    .type("application/pdf")
    .attachment("kailor-analysis-draft.pdf")
    .send(await renderPdf(report.content as unknown as Report));
});
planRouter.get("/plans/:id/reports/:reportId", async (req, res) => {
  const report = await db.reportSnapshot.findFirst({
    where: {
      id: id.parse(req.params.reportId),
      assessment: {
        session: { planId: id.parse(req.params.id), adminId: owner(res) },
      },
    },
  });
  if (!report) throw new AppError(404, "not_found", "Report not found");
  res.json(report);
});
planRouter.get("/preferences", async (_req, res) =>
  res.json(await plans.preferences(owner(res))),
);
planRouter.put("/preferences", async (req, res) =>
  res.json(await plans.savePreference(owner(res), req.body)),
);
planRouter.post(
  "/sessions/:id/plan-proposals/:proposalId",
  async (req, res) => {
    const input = mutationSchema
      .extend({ decision: z.enum(["create", "continue_current", "cancel"]) })
      .strict()
      .parse(req.body);
    res.json(
      await plans.decideProposal(
        id.parse(req.params.id),
        owner(res),
        id.parse(req.params.proposalId),
        input.revision,
        input.decision,
      ),
    );
  },
);

planRouter.post("/sessions/:id/conversation/clear", async (req, res) => {
  const input = mutationSchema.strict().parse(req.body);
  res.json(
    await clearConversation(
      id.parse(req.params.id),
      owner(res),
      input.revision,
    ),
  );
});

planRouter.post("/sessions/:id/discovery/restart", async (req, res) => {
  const input = mutationSchema.strict().parse(req.body);
  res.json(
    await restartDiscovery(id.parse(req.params.id), owner(res), input.revision),
  );
});

planRouter.get("/model-status", async (_req, res) => {
  const guest = !!res.locals.guestId;
  res.json({
    configured:
      remoteEnabled(config) &&
      (!guest || config.AI_ALLOW_GUEST_REMOTE === "true"),
    guest,
    provider: "Cloudflare",
    scope:
      "Configuration only; reachability and usage limits are checked per reply",
  });
});

// Chat and Discovery need freshness only, not the full immutable report payload.
planRouter.get("/sessions/:id/report-status", async (req, res) => {
  const report = await db.reportSnapshot.findFirst({
    where: {
      assessment: {
        sessionId: id.parse(req.params.id),
        session: { adminId: owner(res) },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      assessment: {
        select: {
          knowledgeRevision: true,
          session: { select: { knowledgeRevision: true } },
        },
      },
    },
  });
  if (!report)
    throw new AppError(404, "report_missing", "Prepare an assessment first");
  res.json({
    reportId: report.id,
    stale:
      report.assessment.knowledgeRevision !==
      report.assessment.session.knowledgeRevision,
  });
});
