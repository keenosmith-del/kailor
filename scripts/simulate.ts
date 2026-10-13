import { db } from "../backend/src/db.js";
import { config } from "../backend/src/config.js";
import { personas } from "../backend/src/library.js";
import { simulate } from "../backend/src/session-service.js";
try {
  const admin = await db.adminUser.findUniqueOrThrow({
    where: { email: config.ADMIN_EMAIL },
  });
  for (const persona of personas) {
    const result = await simulate(admin.id, persona.id);
    console.log(
      JSON.stringify({
        persona: persona.id,
        runId: result.id,
        sessionId: result.sessionId,
        passed: result.passed,
        notes: result.evaluationNotes,
      }),
    );
    if (!result.passed) process.exitCode = 1;
  }
} finally {
  await db.$disconnect();
}
