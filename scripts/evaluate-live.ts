import { mkdir, writeFile } from "node:fs/promises";
import { config } from "../backend/src/config.js";
import { remoteEnabled } from "../backend/src/ai.js";
import { db } from "../backend/src/db.js";
import {
  createSession,
  submitAnswer,
  converse,
} from "../backend/src/session-service.js";
// Explicit opt-in is the existing founder configuration, never activated by this script.
const configuration = {
  provider: config.AI_PROVIDER,
  optIn: config.AI_ALLOW_REMOTE === "true",
  credentialsPresent:
    !!config.CLOUDFLARE_ACCOUNT_ID && !!config.CLOUDFLARE_API_TOKEN,
};
const directory = ".cache/qa/iteration006";
await mkdir(directory, { recursive: true });
if (!remoteEnabled(config)) {
  const result = {
    executed: false,
    configuration,
    status:
      "Live model quality unverified: configured remote opt-in and credentials are required",
  };
  console.log(JSON.stringify(result));
  await writeFile(
    `${directory}/live-inference.json`,
    JSON.stringify(result, null, 2),
  );
} else if (!new URL(config.DATABASE_URL).pathname.endsWith("_test")) {
  throw new Error(
    "Live synthetic evaluation requires the isolated _test database; no real-client database is permitted",
  );
} else if (
  config.AI_MAX_OUTPUT_TOKENS > 600 ||
  config.AI_MAX_CALLS_PER_SESSION > 5 ||
  config.AI_MAX_CALLS_PER_DAY > 20
) {
  throw new Error(
    "Set bounded existing budgets: output <=600 tokens, session <=5 calls, daily <=20. Billing is not changed.",
  );
} else {
  const owner = await db.adminUser.create({
    data: {
      email: `live-synthetic-${Date.now()}@kailor.local`,
      passwordHash: "not-a-login-hash",
    },
  });
  const results: unknown[] = [];
  let sessionId = "";
  let subjectId = "";
  try {
    let s = await createSession(
      owner.id,
      "Bounded synthetic model evaluation",
      true,
    );
    sessionId = s.id;
    subjectId = s.subjectId;
    s = await submitAnswer(s.id, owner.id, {
      revision: s.revision,
      questionId: "stage",
      value: "specific",
    });
    s = await submitAnswer(s.id, owner.id, {
      revision: s.revision,
      questionId: "request",
      value:
        "I inspect machinery and want staff to record work offline from phones",
    });
    for (const message of [
      "Would I need a website or an app for these offline inspection reports? Please number the two approaches.",
      "What would the second option involve?",
      "Would the first option be cheaper?",
    ]) {
      const result = await converse(s.id, owner.id, {
        revision: s.revision,
        message,
        mode: "conversation",
      });
      s = result.session;
      results.push({
        message,
        provider: result.provider,
        fallback: result.fallbackReason,
        reply: s.messages.at(-1)?.content,
        proposals: s.evidence
          .filter((e) => e.status === "inferred")
          .map((e) => ({ key: e.key, value: e.value })),
      });
    }
    const usages = await db.aiUsageRecord.findMany({
      where: { sessionId },
      select: {
        provider: true,
        status: true,
        reservedTokens: true,
        reason: true,
      },
    });
    const result = {
      executed: true,
      configuration,
      synthetic: true,
      calls: usages.length,
      maximumCalls: 3,
      results,
      usages,
      caveat:
        "Executed output record; human quality review still required. No commercial outcomes asserted.",
    };
    await writeFile(
      `${directory}/live-inference.json`,
      JSON.stringify(result, null, 2),
    );
    console.log(
      JSON.stringify({
        executed: true,
        calls: usages.length,
        artifact: `${directory}/live-inference.json`,
      }),
    );
  } finally {
    // Keep usage reservations for daily accounting. Retain clearly synthetic session for review.
    await db.auditEvent.create({
      data: {
        actorId: owner.id,
        action: "live.synthetic-evaluation",
        entityId: sessionId,
        details: { synthetic: true, subjectId, maxCalls: 3 },
      },
    });
    await db.$disconnect();
  }
}
