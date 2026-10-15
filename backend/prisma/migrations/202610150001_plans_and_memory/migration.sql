-- Additive migration: every historical session gets its own plan. Do not merge by mutable names/subjects.
CREATE TABLE "Plan" (
 "id" TEXT PRIMARY KEY, "adminId" TEXT NOT NULL, "title" TEXT NOT NULL,
 "description" TEXT NOT NULL DEFAULT '', "archivedAt" TIMESTAMP(3), "revision" INTEGER NOT NULL DEFAULT 0,
 "creationKey" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "Plan_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Plan_id_adminId_key" ON "Plan"("id", "adminId");
CREATE UNIQUE INDEX "Plan_adminId_creationKey_key" ON "Plan"("adminId", "creationKey");
CREATE INDEX "Plan_adminId_archivedAt_updatedAt_idx" ON "Plan"("adminId", "archivedAt", "updatedAt");
ALTER TABLE "DiscoverySession" ADD COLUMN "planId" TEXT;
INSERT INTO "Plan" ("id", "adminId", "title", "creationKey", "createdAt", "updatedAt")
 SELECT d."id", d."adminId", s."name", 'legacy:' || d."id", d."createdAt", d."updatedAt"
 FROM "DiscoverySession" d JOIN "Subject" s ON s."id" = d."subjectId";
UPDATE "DiscoverySession" SET "planId" = "id";
ALTER TABLE "DiscoverySession" ALTER COLUMN "planId" SET NOT NULL;
ALTER TABLE "DiscoverySession" ADD CONSTRAINT "DiscoverySession_planId_adminId_fkey" FOREIGN KEY ("planId", "adminId") REFERENCES "Plan"("id", "adminId") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "DiscoverySession_planId_updatedAt_idx" ON "DiscoverySession"("planId", "updatedAt");
CREATE UNIQUE INDEX "DiscoverySession_id_planId_adminId_key" ON "DiscoverySession"("id", "planId", "adminId");
CREATE TABLE "AccountSettings" (
 "adminId" TEXT PRIMARY KEY, "activePlanId" TEXT, "revision" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "AccountSettings_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "AccountSettings_activePlanId_fkey" FOREIGN KEY ("activePlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "AccountPreference" (
 "id" TEXT PRIMARY KEY, "adminId" TEXT NOT NULL, "key" TEXT NOT NULL, "value" TEXT NOT NULL, "revision" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AccountPreference_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccountPreference_adminId_key_key" ON "AccountPreference"("adminId", "key");
CREATE TABLE "ConversationSummary" (
 "id" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "version" INTEGER NOT NULL, "knowledgeRevision" INTEGER NOT NULL,
 "sourceRevision" INTEGER NOT NULL, "fromOrdinal" INTEGER NOT NULL, "throughOrdinal" INTEGER NOT NULL, "content" JSONB NOT NULL,
 "strategy" TEXT NOT NULL DEFAULT 'structured-excerpts-v2', "superseded" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ConversationSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiscoverySession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ConversationSummary_sessionId_version_key" ON "ConversationSummary"("sessionId", "version");
CREATE INDEX "ConversationSummary_sessionId_superseded_knowledgeRevision_idx" ON "ConversationSummary"("sessionId", "superseded", "knowledgeRevision");
CREATE TABLE "PlanActionProposal" (
 "id" TEXT PRIMARY KEY, "sessionId" TEXT NOT NULL, "sourceMessageId" TEXT NOT NULL, "sourceRevision" INTEGER NOT NULL,
 "title" TEXT NOT NULL, "description" TEXT NOT NULL, "kind" TEXT NOT NULL DEFAULT 'new_plan', "status" TEXT NOT NULL DEFAULT 'pending',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "decidedAt" TIMESTAMP(3),
 CONSTRAINT "PlanActionProposal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DiscoverySession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PlanActionProposal_sessionId_status_idx" ON "PlanActionProposal"("sessionId", "status");
ALTER TABLE "ConversationMessage" ADD COLUMN "intent" TEXT NOT NULL DEFAULT 'discussion', ADD COLUMN "excludedFromContext" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Plan" ADD COLUMN "lastSessionId" TEXT;
UPDATE "Plan" SET "lastSessionId" = "id";
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_lastSessionId_fkey" FOREIGN KEY ("lastSessionId") REFERENCES "DiscoverySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
