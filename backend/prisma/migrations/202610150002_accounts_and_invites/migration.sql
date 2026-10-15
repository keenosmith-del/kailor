-- Accounts default to member. A separate guarded migration step preserves only the configured existing founder.
ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';
CREATE UNIQUE INDEX "AdminUser_email_normalized_key" ON "AdminUser" (lower("email"));
CREATE TABLE "AccountInvite" (
 "tokenHash" TEXT PRIMARY KEY, "email" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
 "usedAt" TIMESTAMP(3), "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "ConversationMessage" ADD COLUMN "hiddenFromTranscript" BOOLEAN NOT NULL DEFAULT false;
