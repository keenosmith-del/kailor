import { Prisma } from "./generated/prisma/client.js";
import { db } from "./db.js";
import { AppError } from "./errors.js";
import { json } from "./session-state.js";
import { canvasStateSchema } from "../../shared/src/consulting.js";
import { evaluateInput } from "./input-quality.js";

export async function saveCanvas(
  planId: string,
  adminId: string,
  revision: number,
  state: unknown,
) {
  const canvasState = canvasStateSchema.parse(state);
  for (const text of [
    ...Object.values(canvasState.edits).flatMap((e) => [e.title, e.notes]),
    ...canvasState.additions.flatMap((e) => [e.title, e.notes]),
  ].filter(Boolean)) {
    if (!evaluateInput(text, "", "chat").accepted)
      throw new AppError(
        422,
        "invalid_canvas_text",
        "Use a clear project note without instructions to change kailor's role.",
      );
  }
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${planId} FOR UPDATE`;
    const p = await tx.plan.findFirst({ where: { id: planId, adminId } });
    if (!p) throw new AppError(404, "not_found", "Project not found");
    if (p.archivedAt)
      throw new AppError(
        409,
        "plan_archived",
        "Archived projects are read-only",
      );
    if (p.revision !== revision)
      throw new AppError(
        409,
        "revision_conflict",
        "This project changed. Reload before saving the canvas.",
      );
    // A bounded inverse state in the audit event supports review; the client also offers one-step undo.
    await tx.auditEvent.create({
      data: {
        actorId: adminId,
        action: "canvas.updated",
        entityId: planId,
        details: json({
          previous: p.canvasState ?? { edits: {}, additions: [] },
          revision,
        }),
      },
    });
    const updated = await tx.plan.update({
      where: { id: planId },
      data: { canvasState: json(canvasState), revision: { increment: 1 } },
    });
    await tx.discoverySession.updateMany({
      where: { planId, adminId },
      data: {
        knowledgeRevision: { increment: 1 },
        revision: { increment: 1 },
        planState: Prisma.DbNull,
        contextState: Prisma.DbNull,
      },
    });
    return { revision: updated.revision, state: canvasState };
  });
}
export async function renameConversation(
  planId: string,
  id: string,
  adminId: string,
  revision: number,
  title: string,
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${planId} AND "adminId" = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${id} AND "adminId" = ${adminId} FOR UPDATE`;
    const s = await tx.discoverySession.findFirst({
      where: { id, planId, adminId },
      include: { plan: true },
    });
    if (!s) throw new AppError(404, "not_found", "Conversation not found");
    if (s.plan.archivedAt)
      throw new AppError(
        409,
        "plan_archived",
        "Archived projects are read-only",
      );
    if (s.revision !== revision)
      throw new AppError(
        409,
        "revision_conflict",
        "This conversation changed. Reload before renaming.",
      );
    const updated = await tx.discoverySession.update({
      where: { id },
      data: { title, revision: { increment: 1 }, planState: Prisma.DbNull },
    });
    return { id: updated.id, title: updated.title, revision: updated.revision };
  });
}
