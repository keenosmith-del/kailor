CREATE TABLE "ConsultancyRequest" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "requestKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "scope" JSONB NOT NULL,
  "notes" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsultancyRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsultancyRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ConsultancyRequest_requestKey_key" ON "ConsultancyRequest"("requestKey");
CREATE INDEX "ConsultancyRequest_ownerId_createdAt_idx" ON "ConsultancyRequest"("ownerId", "createdAt");
CREATE INDEX "ConsultancyRequest_status_createdAt_idx" ON "ConsultancyRequest"("status", "createdAt");

INSERT INTO "Service" ("id", "name", "delivery", "description") VALUES ('instagram', 'Set up an Instagram business page', 'in-house', 'Establish the requested business profile with account ownership and content responsibilities agreed first.') ON CONFLICT ("id") DO NOTHING;
