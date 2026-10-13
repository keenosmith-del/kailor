ALTER TABLE "ConversationMessage" ADD COLUMN "ordinal" INTEGER;
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "sessionId" ORDER BY "createdAt", CASE role WHEN 'user' THEN 0 ELSE 1 END, id) - 1 AS n
  FROM "ConversationMessage"
)
UPDATE "ConversationMessage" SET "ordinal" = ordered.n FROM ordered WHERE "ConversationMessage".id = ordered.id;
ALTER TABLE "ConversationMessage" ALTER COLUMN "ordinal" SET NOT NULL;
CREATE UNIQUE INDEX "ConversationMessage_sessionId_ordinal_key" ON "ConversationMessage"("sessionId", "ordinal");
