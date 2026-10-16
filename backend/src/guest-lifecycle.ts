import { db } from "./db.js";
export async function discardGuestWork(
  owner: string,
  tokenHash?: string,
  now = new Date(),
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "AdminUser" WHERE id = ${owner} FOR UPDATE`;
    const principal = await tx.adminUser.findFirst({
      where: { id: owner, isGuest: true },
    });
    if (!principal) return [];
    if (tokenHash) {
      const auth = await tx.authSession.findFirst({
        where: { tokenHash, adminId: owner, expiresAt: { gt: now } },
      });
      if (!auth) return [];
    } else if (
      await tx.authSession.count({
        where: { adminId: owner, expiresAt: { gt: now } },
      })
    )
      return [];
    await tx.$queryRaw`SELECT id FROM "DiscoverySession" WHERE "adminId" = ${owner} FOR UPDATE`;
    const sessions = await tx.discoverySession.findMany({
      where: { adminId: owner },
      select: { id: true, subjectId: true },
    });
    await tx.discoverySession.deleteMany({ where: { adminId: owner } });
    await tx.subject.deleteMany({
      where: {
        id: { in: sessions.map((s) => s.subjectId) },
        sessions: { none: {} },
      },
    });
    await tx.auditEvent.deleteMany({ where: { actorId: owner } });
    await tx.adminUser.deleteMany({ where: { id: owner, isGuest: true } });
    return sessions.map((s) => s.id);
  });
}
export async function purgeExpiredGuests(now = new Date()) {
  const guests = await db.adminUser.findMany({
    where: {
      isGuest: true,
      sessions: { none: { expiresAt: { gt: now } } },
      OR: [
        { sessions: { some: { expiresAt: { lte: now } } } },
        {
          sessions: { none: {} },
          createdAt: { lte: new Date(now.getTime() - 86400000) },
        },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
  for (const guest of guests) await discardGuestWork(guest.id, undefined, now);
  return guests.length;
}
