import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import type { Prisma } from "./generated/prisma/client.js";
import { AppError } from "./errors.js";
import { version } from "./discovery.js";
import {
  json,
  answersOf,
  getSession,
  nextForSession,
} from "./session-service.js";
import { readPersonalMemory } from "./personal-memory.js";
import {
  preferenceInput,
  type PlanUnderstanding,
} from "../../shared/src/index.js";

const planSelect = {
  id: true,
  title: true,
  description: true,
  archivedAt: true,
  revision: true,
  createdAt: true,
  updatedAt: true,
  lastSessionId: true,
  sessions: {
    select: {
      id: true,
      updatedAt: true,
      knowledgeRevision: true,
      synthetic: true,
    },
    orderBy: { updatedAt: "desc" as const },
    take: 10,
  },
  _count: { select: { sessions: true } },
};
export async function ownedPlan(
  id: string,
  adminId: string,
  tx: Prisma.TransactionClient = db,
) {
  const p = await tx.plan.findFirst({ where: { id, adminId } });
  if (!p) throw new AppError(404, "not_found", "Plan not found");
  return p;
}
function active(p: { archivedAt: Date | null }) {
  if (p.archivedAt)
    throw new AppError(
      409,
      "plan_archived",
      "Restore this plan before changing it",
    );
}
async function audit(
  tx: Prisma.TransactionClient,
  adminId: string,
  action: string,
  id: string,
  details: unknown = {},
) {
  await tx.auditEvent.create({
    data: { actorId: adminId, action, entityId: id, details: json(details) },
  });
}
export async function listPlans(
  adminId: string,
  archived = false,
  cursor?: string,
) {
  const rows = await db.plan.findMany({
    where: {
      adminId,
      archivedAt: archived ? { not: null } : null,
      ...(cursor ? { id: { gt: cursor } } : {}),
    },
    select: planSelect,
    orderBy: { id: "asc" },
    take: 31,
  });
  const selection = await db.accountSettings.findUnique({ where: { adminId } });
  return {
    plans: rows.slice(0, 30),
    selection: {
      activePlanId: selection?.activePlanId ?? null,
      revision: selection?.revision ?? 0,
    },
    nextCursor: rows.length > 30 ? rows[29].id : null,
  };
}
export async function createPlan(
  adminId: string,
  input: { title: string; description: string; creationKey: string },
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    const existing = await tx.plan.findUnique({
      where: {
        adminId_creationKey: { adminId, creationKey: input.creationKey },
      },
    });
    if (existing) {
      // The key identifies the original operation even after a later rename.
      const event = await tx.auditEvent.findFirst({
        where: {
          actorId: adminId,
          entityId: existing.id,
          action: "plan.created",
        },
      });
      const original = event?.details as
        | { title?: string; description?: string }
        | undefined;
      if (
        original &&
        (original.title !== input.title ||
          original.description !== input.description)
      )
        throw new AppError(
          409,
          "idempotency_conflict",
          "This request key belongs to a different plan creation",
        );
      return tx.plan.findUniqueOrThrow({
        where: { id: existing.id },
        select: planSelect,
      });
    }
    const principal = await tx.adminUser.findUniqueOrThrow({
      where: { id: adminId },
    });
    if (principal.isGuest && (await tx.plan.count({ where: { adminId } })))
      throw new AppError(
        409,
        "guest_project_limit",
        "Your temporary project is already open. Sign in to create more projects.",
      );
    const p = await tx.plan.create({ data: { adminId, ...input } });
    const session = await tx.discoverySession.create({
      data: {
        admin: { connect: { id: adminId } },
        plan: { connect: { id_adminId: { id: p.id, adminId } } },
        definitionVersion: version,
        subject: { create: { name: p.title } },
      },
    });
    await tx.plan.update({
      where: { id: p.id },
      data: { lastSessionId: session.id },
    });
    await audit(tx, adminId, "plan.created", p.id, {
      title: input.title,
      description: input.description,
      sessionId: session.id,
    });
    return tx.plan.findUniqueOrThrow({
      where: { id: p.id },
      select: planSelect,
    });
  });
}
export async function updatePlan(
  id: string,
  adminId: string,
  input: {
    revision: number;
    title?: string;
    description?: string;
    archived?: boolean;
  },
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${id} FOR UPDATE`;
    const p = await ownedPlan(id, adminId, tx);
    if (input.archived === false && p.archivedAt) {
      const principal = await tx.adminUser.findUniqueOrThrow({
        where: { id: adminId },
      });
      if (
        principal.isGuest &&
        (await tx.plan.count({ where: { adminId, archivedAt: null } }))
      )
        throw new AppError(
          409,
          "guest_project_limit",
          "Guests can have one active project. Keep this archived journey in an account to continue it.",
        );
    }
    if (p.revision !== input.revision)
      throw new AppError(
        409,
        "revision_conflict",
        "This plan changed. Refresh the plan list",
      );
    await tx.plan.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.archived !== undefined
          ? { archivedAt: input.archived ? new Date() : null }
          : {}),
        revision: { increment: 1 },
      },
    });
    if (input.archived)
      await tx.accountSettings.updateMany({
        where: { adminId, activePlanId: id },
        data: { activePlanId: null, revision: { increment: 1 } },
      });
    await audit(
      tx,
      adminId,
      input.archived === true
        ? "plan.archived"
        : input.archived === false
          ? "plan.restored"
          : "plan.updated",
      id,
      { revision: input.revision },
    );
    return tx.plan.findUniqueOrThrow({ where: { id }, select: planSelect });
  });
}
export async function selectPlan(
  id: string,
  adminId: string,
  revision: number,
  sessionId?: string,
) {
  return db.$transaction(async (tx) => {
    // Account-first serialization prevents two tabs silently overwriting the active selection.
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    const p = await ownedPlan(id, adminId, tx);
    active(p);
    const selection = await tx.accountSettings.findUnique({
      where: { adminId },
    });
    if ((selection?.revision ?? 0) !== revision)
      throw new AppError(
        409,
        "selection_conflict",
        "Your active plan changed in another view. Refresh the plan list",
      );
    const session = await tx.discoverySession.findFirst({
      where: {
        adminId,
        planId: id,
        ...(sessionId
          ? { id: sessionId }
          : p.lastSessionId
            ? { id: p.lastSessionId }
            : {}),
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!session)
      throw new AppError(404, "not_found", "Discovery not found in this plan");
    await tx.plan.update({
      where: { id },
      data: { lastSessionId: session.id },
    });
    const updated = await tx.accountSettings.upsert({
      where: { adminId },
      create: { adminId, activePlanId: id, revision: 1 },
      update: { activePlanId: id, revision: { increment: 1 } },
    });
    await audit(tx, adminId, "plan.selected", id, {
      sessionId: session.id,
      revision: updated.revision,
    });
    return { sessionId: session.id, selection: updated };
  });
}
export async function newDiscovery(
  id: string,
  adminId: string,
  revision: number,
  creationKey: string,
  carryContext = false,
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Plan" WHERE id = ${id} FOR UPDATE`;
    const p = await ownedPlan(id, adminId, tx);
    active(p);
    const prior = await tx.auditEvent.findFirst({
      where: {
        actorId: adminId,
        entityId: id,
        action: "plan.discovery-created",
        details: { path: ["creationKey"], equals: creationKey },
      },
    });
    if (prior)
      return { sessionId: (prior.details as { sessionId: string }).sessionId };
    if (p.revision !== revision)
      throw new AppError(
        409,
        "revision_conflict",
        "This plan changed. Refresh before starting a discovery",
      );
    const session = await tx.discoverySession.create({
      data: {
        admin: { connect: { id: adminId } },
        plan: { connect: { id_adminId: { id, adminId } } },
        definitionVersion: version,
        subject: { create: { name: p.title } },
      },
    });
    if (carryContext && p.lastSessionId) {
      // Serialize the snapshot with Chat/Discovery mutations in the source session.
      await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${p.lastSessionId} AND "adminId" = ${adminId} FOR UPDATE`;
      // Copy only authoritative answers and confirmed evidence inside this owned project.
      const previous = await tx.discoverySession.findFirstOrThrow({
        where: { id: p.lastSessionId, planId: id, adminId },
        include: {
          answers: true,
          evidence: { where: { active: true, status: "confirmed" } },
        },
      });
      await tx.discoveryAnswer.createMany({
        data: previous.answers.map((a) => ({
          sessionId: session.id,
          questionId: a.questionId,
          value: json(a.value),
          skipped: a.skipped,
          responseState: a.responseState,
          ...(a.quality ? { quality: json(a.quality) } : {}),
        })),
      });
      await tx.evidence.createMany({
        data: previous.evidence.map((e) => ({
          sessionId: session.id,
          key: e.key,
          value: json(e.value),
          status: e.status,
          source: e.source,
          active: true,
          provenance: json({
            ...((e.provenance as object) ?? {}),
            inheritedFromSessionId: previous.id,
            inheritedFromEvidenceId: e.id,
          }),
        })),
      });
      await tx.discoverySession.update({
        where: { id: session.id },
        data: {
          synthetic: previous.synthetic,
          knowledgeRevision: previous.knowledgeRevision,
        },
      });
    }
    await tx.plan.update({
      where: { id },
      data: { lastSessionId: session.id, revision: { increment: 1 } },
    });
    await audit(tx, adminId, "plan.discovery-created", id, {
      sessionId: session.id,
      creationKey,
    });
    return { sessionId: session.id };
  });
}
export async function understanding(
  id: string,
  adminId: string,
  sessionId?: string,
): Promise<PlanUnderstanding> {
  const p = await ownedPlan(id, adminId);
  const sessions = await db.discoverySession.findMany({
    where: { planId: id, adminId },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const selected = sessionId ?? p.lastSessionId ?? sessions[0]?.id;
  const s = await getSession(selected ?? "", adminId);
  if (s.planId !== id)
    throw new AppError(404, "not_found", "Discovery not found in this plan");
  const plan = await nextForSession(s.id, adminId);
  const memory = await readPersonalMemory(s, "");
  return {
    plan: {
      id: p.id,
      title: p.title,
      archivedAt: p.archivedAt?.toISOString() ?? null,
    },
    sessions: sessions.map((x) => ({
      ...x,
      updatedAt: x.updatedAt.toISOString(),
    })),
    confirmed: plan.context.facts,
    pending: s.evidence.filter(
      (e) => e.status === "inferred",
    ) as PlanUnderstanding["pending"],
    readiness: plan.readiness,
    corrections: plan.context.corrections,
    summary: memory.summary ?? null,
    unknowns: plan.readiness.uncertainties,
  };
}
export async function comparePlans(adminId: string, ids: string[]) {
  // All requested owners are checked before retrieving any facts. Never sent to inference or persisted as evidence.
  const plans = await db.plan.findMany({ where: { id: { in: ids }, adminId } });
  if (plans.length !== ids.length)
    throw new AppError(404, "not_found", "A requested plan was not found");
  const sides = [];
  for (const id of ids) {
    const u = await understanding(id, adminId);
    sides.push({
      planId: id,
      title: u.plan.title,
      confirmed: u.confirmed.filter((f) =>
        [
          "goals",
          "request",
          "presence",
          "websiteStatus",
          "tools",
          "constraints",
          "budget",
          "timing",
          "appPreference",
          "websitePreference",
        ].includes(f.key),
      ),
      readiness: u.readiness.state,
      unknowns: u.unknowns,
    });
  }
  return {
    kind: "explicit-cross-plan-comparison",
    scope:
      "Confirmed requirements shown side by side; not an assessment or new evidence",
    plans: sides,
  };
}
export async function preferences(adminId: string) {
  return db.accountPreference.findMany({
    where: { adminId },
    select: { key: true, value: true, revision: true },
    orderBy: { key: "asc" },
  });
}
export async function savePreference(adminId: string, raw: unknown) {
  const input = preferenceInput.parse(raw);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    const old = await tx.accountPreference.findUnique({
      where: { adminId_key: { adminId, key: input.key } },
    });
    if ((old?.revision ?? 0) !== input.revision)
      throw new AppError(
        409,
        "revision_conflict",
        "This account preference changed. Refresh it",
      );
    await tx.accountPreference.upsert({
      where: { adminId_key: { adminId, key: input.key } },
      create: { adminId, key: input.key, value: input.value ?? "" },
      update: { value: input.value ?? "", revision: { increment: 1 } },
    });
    await audit(tx, adminId, "account.preference-reviewed", adminId, {
      key: input.key,
      removed: input.value === null,
    });
    return tx.accountPreference.findMany({
      where: { adminId },
      select: { key: true, value: true, revision: true },
    });
  });
}
export async function decideProposal(
  sessionId: string,
  adminId: string,
  proposalId: string,
  revision: number,
  decision: "create" | "continue_current" | "cancel",
) {
  const s = await getSession(sessionId, adminId);
  active(s.plan);
  const proposal = await db.planActionProposal.findFirst({
    where: { id: proposalId, sessionId },
  });
  if (!proposal)
    throw new AppError(404, "not_found", "Plan proposal not found");
  // Serialize proposal decisions; creation and the decision are atomic, with stable request identity.
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${adminId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE id = ${sessionId} FOR UPDATE`;
    const current = await tx.planActionProposal.findUniqueOrThrow({
      where: { id: proposalId },
    });
    if (current.status !== "pending") {
      if (current.status !== decision)
        throw new AppError(
          409,
          "proposal_decided",
          "This proposal has already been reviewed",
        );
      const p =
        decision === "create"
          ? await tx.plan.findUnique({
              where: {
                adminId_creationKey: { adminId, creationKey: proposalId },
              },
              select: planSelect,
            })
          : null;
      return { plan: p, decision };
    }
    const state = await tx.discoverySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { plan: true },
    });
    active(state.plan);
    if (state.revision !== revision)
      throw new AppError(
        409,
        "revision_conflict",
        "Refresh before reviewing this plan proposal",
      );
    let created = null;
    if (decision === "create") {
      const principal = await tx.adminUser.findUniqueOrThrow({
        where: { id: adminId },
      });
      if (principal.isGuest)
        throw new AppError(
          409,
          "guest_project_limit",
          "Sign in to create another project. Your temporary project stays saved separately.",
        );
      const p = await tx.plan.create({
        data: {
          adminId,
          title: current.title,
          description: current.description,
          creationKey: proposalId,
        },
      });
      const fresh = await tx.discoverySession.create({
        data: {
          admin: { connect: { id: adminId } },
          plan: { connect: { id_adminId: { id: p.id, adminId } } },
          definitionVersion: version,
          subject: { create: { name: p.title } },
        },
      });
      await tx.plan.update({
        where: { id: p.id },
        data: { lastSessionId: fresh.id },
      });
      created = await tx.plan.findUniqueOrThrow({
        where: { id: p.id },
        select: planSelect,
      });
      await tx.accountSettings.upsert({
        where: { adminId },
        create: { adminId, activePlanId: p.id, revision: 1 },
        update: { activePlanId: p.id, revision: { increment: 1 } },
      });
      await audit(tx, adminId, "plan.created", p.id, {
        title: current.title,
        description: current.description,
        sessionId: fresh.id,
        proposalId,
      });
    }
    await tx.planActionProposal.update({
      where: { id: proposalId },
      data: { status: decision, decidedAt: new Date() },
    });
    await tx.discoverySession.update({
      where: { id: sessionId },
      data: { revision: { increment: 1 } },
    });
    await audit(tx, adminId, "plan.proposal-reviewed", s.planId, {
      proposalId,
      decision,
    });
    return { plan: created, decision };
  });
}
