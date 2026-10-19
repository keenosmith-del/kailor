import { Router } from "express";
import { z } from "zod";
import PDFDocument from "pdfkit";
import { db } from "./db.js";
import { canvas } from "./session-service.js";
import { ownedPlan } from "./plan-service.js";
import { requireAdmin } from "./auth.js";
import { AppError } from "./errors.js";
import { json } from "./session-state.js";
import { evaluateInput } from "./input-quality.js";
import {
  solutionStatus,
  isProjectConstraint,
  unresolvedSelections,
} from "../../shared/src/solutions.js";
export const solutionRouter = Router();
const owner = (res: { locals: Record<string, any> }) =>
  String(res.locals.adminId ?? res.locals.guestId);
export const requestInput = z
  .object({
    sessionId: z.uuid(),
    requestKey: z.uuid(),
    projectRevision: z.number().int().nonnegative(),
    solutions: z
      .array(
        z
          .object({
            id: z.string().min(1).max(100),
            revision: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .min(1)
      .max(30)
      .refine(
        (s) => new Set(s.map((x) => x.id)).size === s.length,
        "Select each solution once",
      ),
    notes: z.string().trim().max(3000),
  })
  .strict();
solutionRouter.get("/consultancy-requests", requireAdmin, async (req, res) => {
  const query = z
    .object({ cursor: z.uuid().optional() })
    .strict()
    .parse(req.query);
  const rows = await db.consultancyRequest.findMany({
    include: {
      plan: {
        select: { title: true, admin: { select: { name: true, email: true } } },
      },
    },
    orderBy: { id: "asc" },
    take: 31,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });
  res.json({
    requests: rows.slice(0, 30),
    nextCursor: rows.length > 30 ? rows[29].id : null,
  });
});
solutionRouter.get("/plans/:id/consultancy-requests", async (req, res) => {
  const planId = z.uuid().parse(req.params.id);
  await ownedPlan(planId, owner(res));
  res.json({
    requests: await db.consultancyRequest.findMany({
      where: { planId, ownerId: owner(res) },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  });
});
solutionRouter.post("/plans/:id/consultancy-requests", async (req, res) => {
  if (!res.locals.adminId || res.locals.guestId)
    throw new AppError(
      401,
      "account_required",
      "Sign in and keep this project to submit a consultancy request.",
    );
  const planId = z.uuid().parse(req.params.id),
    input = requestInput.parse(req.body),
    ownerId = owner(res);
  if (input.notes && !evaluateInput(input.notes, "", "chat").accepted)
    throw new AppError(422, "invalid_notes", "Use clear project notes.");
  const row = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${planId} FOR UPDATE`;
    const plan = await ownedPlan(planId, ownerId, tx);
    const existing = await tx.consultancyRequest.findUnique({
      where: { requestKey: input.requestKey },
    });
    if (existing) {
      if (existing.planId !== planId || existing.ownerId !== ownerId)
        throw new AppError(
          409,
          "request_key_conflict",
          "Start a new request draft before submitting.",
        );
      return existing;
    }
    if (plan.archivedAt || plan.revision !== input.projectRevision)
      throw new AppError(
        409,
        "scope_changed",
        "Project changed. Reload and review the selected scope again.",
      );
    const session = await tx.discoverySession.findFirst({
      where: { id: input.sessionId, planId, adminId: ownerId },
    });
    if (!session)
      throw new AppError(404, "not_found", "Project conversation not found");
    const current = await canvas(input.sessionId, ownerId);
    if (unresolvedSelections(current.state, current.solutions).length)
      throw new AppError(
        409,
        "scope_changed",
        "Reconcile previous selections that are no longer recommended before submitting.",
      );
    const scope = input.solutions.map((ref) => {
      const solution = current.solutions.find((s) => s.id === ref.id);
      if (
        !solution ||
        !solution.selected ||
        solution.reviewRequired ||
        solution.revision !== ref.revision
      )
        throw new AppError(
          409,
          "scope_changed",
          "Review changes to each selected solution before submitting.",
        );
      return solution;
    });
    return tx.consultancyRequest.create({
      data: {
        planId,
        ownerId,
        sessionId: input.sessionId,
        requestKey: input.requestKey,
        notes: input.notes,
        scope: json({
          projectRevision: plan.revision,
          knowledgeRevision: session.knowledgeRevision,
          solutions: scope,
          constraints:
            current.consulting?.facts.filter(isProjectConstraint) ?? [],
        }),
      },
    });
  });
  res
    .status(201)
    .json({ id: row.id, status: row.status, createdAt: row.createdAt });
});
solutionRouter.get(
  "/sessions/:id/solutions/:solutionId/reasoning",
  async (req, res) => {
    const current = await canvas(z.uuid().parse(req.params.id), owner(res));
    const solution = current.solutions.find(
      (s) => s.id === req.params.solutionId,
    );
    if (!solution)
      throw new AppError(
        404,
        "not_found",
        "Solution no longer available. Reload the canvas.",
      );
    const doc = new PDFDocument({
      size: "A4",
      margin: 54,
      info: { Title: `${solution.title} — reasoning`, Author: "kailor" },
    });
    res.type("application/pdf").attachment("kailor-solution-reasoning.pdf");
    doc.pipe(res);
    const print = (s: string) =>
      s.replace(/[\u2010-\u2015]/g, "-").replace(/…/g, "...");
    const section = (title: string, lines: string[]) => {
      lines = lines.map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return;
      if (doc.y > 690) doc.addPage();
      doc
        .moveDown()
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#302f2a")
        .text(title);
      for (const line of lines)
        doc
          .moveDown(0.4)
          .font("Helvetica")
          .fontSize(10)
          .text(print(line), { lineGap: 3 });
    };
    doc
      .fontSize(12)
      .text("kailor")
      .moveDown()
      .fontSize(23)
      .text(print(solution.title));
    section("Current living project context", [
      `Prepared ${new Date().toISOString().slice(0, 10)} from the current saved solution. Later changes require a new export.`,
      `State: ${solutionStatus(solution)}. Origin: ${solution.source}. This is a recommendation explanation, not a quote or commissioned engagement. Historical assessments remain unchanged.`,
    ]);
    section("Purpose", [solution.objective ?? solution.description]);
    section("Why this was proposed", [solution.why]);
    section(
      "User-reported evidence",
      [...new Set(solution.facts.map((f) => f.sourceKey))].map((key) => {
        const facts = solution.facts
          .filter((f) => f.sourceKey === key)
          .sort(
            (a, b) =>
              Number(a.id.split("-").at(-1)) - Number(b.id.split("-").at(-1)),
          );
        return `${facts[0].label}: ${facts.map((f) => f.quote).join(" ")}`;
      }),
    );
    for (const priority of ["essential", "optional", "deferred", "unconfirmed"])
      section(
        `${priority[0].toUpperCase()}${priority.slice(1)} capabilities`,
        solution.requirements
          .filter((r) => r.priority === priority)
          .map(
            (r) =>
              `${r.label}${r.conflict ? ` — ${r.conflict}` : ""}. Basis: ${[...new Set(r.provenance.map((p) => `${p.sourceKey === "canvas" ? "Your refinement" : "Your project information"} (${p.basis})`))].join("; ")}`,
          ),
      );
    section("Scope to verify", solution.includes);
    section("Constraints", solution.constraints);
    section("Alternatives and trade-offs", solution.alternatives);
    section("Still to decide", solution.unknowns);
    section(
      "Recorded refinements and decisions",
      Object.entries(current.state.edits)
        .filter(
          ([id]) =>
            id === solution.id ||
            solution.requirements.some((r) => r.id === id),
        )
        .flatMap(([id, edit]) => {
          const label =
            id === solution.id
              ? solution.title
              : (solution.requirements.find((r) => r.id === id)?.label ??
                "Requirement");
          return [
            edit.title ? `${label}: title refined to ${edit.title}` : "",
            edit.notes
              ? `${label}: objective and scope refined by you; reflected above.`
              : "",
            edit.priority
              ? `${label}: priority changed to ${edit.priority}`
              : "",
            edit.decision
              ? `${label}: decision recorded as ${edit.decision}`
              : "",
          ].filter(Boolean);
        }),
    );
    section("Next step", [solution.nextStep]);
    doc.end();
  },
);
