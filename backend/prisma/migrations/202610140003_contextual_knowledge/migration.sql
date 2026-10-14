-- Preserve optimistic locking and historical content. Conservative legacy backfill.
ALTER TABLE "DiscoverySession" ADD COLUMN "knowledgeRevision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Assessment" ADD COLUMN "knowledgeRevision" INTEGER NOT NULL DEFAULT 0;
UPDATE "DiscoverySession" SET "knowledgeRevision" = "revision";
UPDATE "Assessment" SET "knowledgeRevision" = "sessionRevision";
CREATE INDEX "Assessment_sessionId_knowledgeRevision_idx" ON "Assessment" ("sessionId", "knowledgeRevision");
