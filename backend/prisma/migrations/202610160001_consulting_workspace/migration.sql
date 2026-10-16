ALTER TABLE "Plan" ADD COLUMN "canvasState" JSONB;
ALTER TABLE "DiscoverySession" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'New conversation';
