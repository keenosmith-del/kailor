CREATE TABLE "ProjectSource" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "url" TEXT,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectSource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProjectSource_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProjectSource_planId_createdAt_idx" ON "ProjectSource"("planId", "createdAt");
