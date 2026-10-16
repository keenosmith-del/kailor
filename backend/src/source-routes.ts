import type { Prisma } from "./generated/prisma/client.js";
import { Router, raw } from "express";
import { z } from "zod";
import { db } from "./db.js";
import { ownedPlan } from "./plan-service.js";
import { AppError } from "./errors.js";
import { evaluateInput } from "./input-quality.js";
export const sourceRouter = Router();
const id = z.uuid();
const owner = (res: { locals: Record<string, any> }) =>
  String(res.locals.adminId ?? res.locals.guestId);
const title = z.string().trim().min(1).max(150);
export function validateSourceText(content: string) {
  if (
    !content.trim() ||
    content.length > 16000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(content)
  )
    throw new AppError(
      422,
      "source_content",
      "Use a nonempty UTF-8 text or CSV file with at most 16,000 characters.",
    );
  if (!evaluateInput(content, "", "chat").accepted)
    throw new AppError(
      422,
      "source_content",
      "This material cannot be used as project reference text.",
    );
  return content;
}
async function storeSource(
  planId: string,
  adminId: string,
  data: Omit<
    Prisma.ProjectSourceUncheckedCreateInput,
    "id" | "planId" | "createdAt"
  >,
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${planId} FOR UPDATE`;
    const plan = await ownedPlan(planId, adminId, tx);
    if (plan.archivedAt)
      throw new AppError(
        409,
        "plan_archived",
        "Restore this project before adding resources.",
      );
    if ((await tx.projectSource.count({ where: { planId } })) >= 100)
      throw new AppError(
        409,
        "source_limit",
        "This project has reached its limit of 100 resources.",
      );
    return tx.projectSource.create({ data: { ...data, planId } });
  });
}
sourceRouter.get("/plans/:id/sources", async (req, res) => {
  const planId = id.parse(req.params.id);
  await ownedPlan(planId, owner(res));
  const query = z
    .object({
      cursor: id.optional(),
      category: z.enum(["all", "documents", "references", "notes"]).optional(),
    })
    .strict()
    .parse(req.query);
  const rows = await db.projectSource.findMany({
    where: {
      planId,
      plan: { adminId: owner(res) },
      ...(query.category === "documents"
        ? { kind: { in: ["text", "csv"] } }
        : query.category === "references"
          ? { kind: "link" }
          : query.category === "notes"
            ? { kind: "note" }
            : {}),
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
    },
    orderBy: { id: "asc" },
    take: 21,
    select: {
      id: true,
      title: true,
      kind: true,
      url: true,
      status: true,
      createdAt: true,
    },
  });
  res.json({
    sources: rows.slice(0, 20),
    nextCursor: rows.length > 20 ? rows[19].id : null,
  });
});
sourceRouter.post("/plans/:id/sources", async (req, res) => {
  const planId = id.parse(req.params.id);
  const plan = await ownedPlan(planId, owner(res));
  if (plan.archivedAt)
    throw new AppError(
      409,
      "plan_archived",
      "Restore this project before adding resources.",
    );
  const input = z
    .discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("note"),
          title,
          content: z.string().min(1).max(16000),
        })
        .strict(),
      z
        .object({ kind: z.literal("link"), title, url: z.url().max(2000) })
        .strict(),
    ])
    .parse(req.body);
  let url: string | undefined;
  if (input.kind === "link") {
    const parsed = new URL(input.url);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    )
      throw new AppError(
        422,
        "source_url",
        "Use an HTTP or HTTPS link without credentials.",
      );
    url = parsed.href;
  }
  const row = await storeSource(planId, owner(res), {
    title: input.title,
    kind: input.kind,
    content: input.kind === "note" ? validateSourceText(input.content) : "",
    url,
    status: input.kind === "link" ? "not_retrieved" : "ready",
  });
  res.status(201).json({ id: row.id, status: row.status });
});
sourceRouter.post(
  "/plans/:id/sources/file",
  raw({ type: "application/octet-stream", limit: "64kb" }),
  async (req, res) => {
    const planId = id.parse(req.params.id);
    const plan = await ownedPlan(planId, owner(res));
    if (plan.archivedAt)
      throw new AppError(
        409,
        "plan_archived",
        "Restore this project before adding resources.",
      );
    const name = title.parse(req.get("X-File-Name"));
    if (!/\.(txt|csv)$/i.test(name) || !Buffer.isBuffer(req.body))
      throw new AppError(
        415,
        "source_format",
        "Only UTF-8 .txt and .csv files are supported. PDF and Word extraction are not available.",
      );
    let content: string;
    try {
      content = new TextDecoder("utf-8", { fatal: true }).decode(req.body);
    } catch {
      throw new AppError(
        422,
        "source_encoding",
        "Save the file as UTF-8 text or CSV.",
      );
    }
    validateSourceText(content);
    const row = await storeSource(planId, owner(res), {
      title: name,
      kind: /\.csv$/i.test(name) ? "csv" : "text",
      content,
      status: "ready",
    });
    res.status(201).json({ id: row.id, status: row.status });
  },
);
sourceRouter.get("/plans/:id/sources/:sourceId", async (req, res) => {
  const planId = id.parse(req.params.id);
  await ownedPlan(planId, owner(res));
  const row = await db.projectSource.findFirst({
    where: {
      id: id.parse(req.params.sourceId),
      planId,
      plan: { adminId: owner(res) },
    },
  });
  if (!row) throw new AppError(404, "not_found", "Resource not found");
  res.json(row);
});
sourceRouter.delete("/plans/:id/sources/:sourceId", async (req, res) => {
  const planId = id.parse(req.params.id);
  const plan = await ownedPlan(planId, owner(res));
  if (plan.archivedAt)
    throw new AppError(
      409,
      "plan_archived",
      "Restore this project before deleting resources.",
    );
  const result = await db.projectSource.deleteMany({
    where: {
      id: id.parse(req.params.sourceId),
      planId,
      plan: { adminId: owner(res) },
    },
  });
  if (!result.count) throw new AppError(404, "not_found", "Resource not found");
  res.status(204).end();
});
