ALTER TABLE "DiscoveryAnswer" ADD COLUMN "responseState" TEXT NOT NULL DEFAULT 'answered', ADD COLUMN "quality" JSONB;
UPDATE "DiscoveryAnswer" SET "responseState" = CASE WHEN "skipped" THEN 'skipped' WHEN "value" = '"Not applicable"'::jsonb THEN 'not_applicable' ELSE 'answered' END;
ALTER TABLE "Evidence" ADD COLUMN "provenance" JSONB;
ALTER TABLE "SimulationRun" ALTER COLUMN "assessmentId" DROP NOT NULL;
ALTER TABLE "CaseIntelligenceRecord" ADD COLUMN "reviewVersion" INTEGER NOT NULL DEFAULT 0;
