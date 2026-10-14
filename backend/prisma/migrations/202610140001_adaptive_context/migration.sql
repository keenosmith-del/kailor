-- Additive: existing answers, evidence, reports and session definition IDs remain intact.
ALTER TABLE "DiscoverySession" ADD COLUMN "contextState" JSONB, ADD COLUMN "planState" JSONB;
