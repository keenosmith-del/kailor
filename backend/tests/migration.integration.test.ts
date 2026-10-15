import { it, expect } from "vitest";
import { Client } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { config } from "../src/config.js";
if (!new URL(config.DATABASE_URL).pathname.endsWith("_test"))
  throw Error("Migration test requires _test database");
it("migrates representative legacy sessions separately without changing messages, credentials, evidence or immutable reports", async () => {
  const client = new Client({ connectionString: config.DATABASE_URL });
  await client.connect();
  const schema = `migration_007_${randomUUID().replaceAll("-", "")}`;
  const root = fileURLToPath(new URL("../prisma/migrations/", import.meta.url));
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const directories = (await readdir(root))
      .filter((d) => /^\d/.test(d))
      .sort();
    for (const d of directories.filter(
      (d) => d < "202610150001_plans_and_memory",
    ))
      await client.query(await readFile(`${root}/${d}/migration.sql`, "utf8"));
    const owner = randomUUID(),
      other = randomUUID(),
      subject = randomUUID(),
      s1 = randomUUID(),
      s2 = randomUUID(),
      s3 = randomUUID(),
      assessment = randomUUID();
    await client.query(
      'INSERT INTO "AdminUser" (id,email,"passwordHash") VALUES ($1,$2,$3),($4,$5,$3)',
      [
        owner,
        "migration-a@test.local",
        "unchanged-password-hash",
        other,
        "migration-b@test.local",
      ],
    );
    // Shared/misleading historical subject names must never merge sessions or ownership.
    await client.query('INSERT INTO "Subject" (id,name) VALUES ($1,$2)', [
      subject,
      "Same old business name",
    ]);
    for (const [id, adminId] of [
      [s1, owner],
      [s2, owner],
      [s3, other],
    ])
      await client.query(
        'INSERT INTO "DiscoverySession" (id,"adminId","subjectId","definitionVersion","updatedAt") VALUES ($1,$2,$3,$4,NOW())',
        [id, adminId, subject, "1.0.0"],
      );
    await client.query(
      'INSERT INTO "ConversationMessage" (id,"sessionId",role,ordinal,content,provider) VALUES ($1,$2,$3,0,$4,$5)',
      [randomUUID(), s1, "user", "My original private conversation", "user"],
    );
    await client.query(
      'INSERT INTO "Evidence" (id,"sessionId",key,value,status,source) VALUES ($1,$2,$3,$4::jsonb,$5,$6)',
      [
        randomUUID(),
        s1,
        "goals",
        JSON.stringify("My original goal"),
        "confirmed",
        "guided",
      ],
    );
    await client.query(
      'INSERT INTO "Assessment" (id,"sessionId","sessionRevision",summary) VALUES ($1,$2,1,$3)',
      [assessment, s1, "Original assessment"],
    );
    await client.query(
      'INSERT INTO "ReportSnapshot" (id,"assessmentId",content) VALUES ($1,$2,$3::jsonb)',
      [
        randomUUID(),
        assessment,
        JSON.stringify({
          title: "Original immutable report",
          recommendations: ["untouched"],
        }),
      ],
    );
    const before = (await client.query('SELECT content FROM "ReportSnapshot"'))
      .rows;
    await client.query(
      await readFile(
        `${root}/202610150001_plans_and_memory/migration.sql`,
        "utf8",
      ),
    );
    await client.query(
      await readFile(
        `${root}/202610150002_accounts_and_invites/migration.sql`,
        "utf8",
      ),
    );
    expect(
      (await client.query('SELECT role FROM "AdminUser"')).rows.every(
        (r) => r.role === "member",
      ),
    ).toBe(true);
    expect(
      (
        await client.query(
          'SELECT "hiddenFromTranscript" FROM "ConversationMessage"',
        )
      ).rows[0].hiddenFromTranscript,
    ).toBe(false);
    const plans = (await client.query('SELECT * FROM "Plan" ORDER BY id')).rows;
    expect(plans).toHaveLength(3);
    expect(new Set(plans.map((p) => p.id)).size).toBe(3);
    for (const p of plans) {
      expect(p.lastSessionId).toBe(p.id);
      expect(p.creationKey).toBe(`legacy:${p.id}`);
      expect(p.adminId).toBe(p.id === s3 ? other : owner);
    }
    expect(
      (await client.query('SELECT content FROM "ReportSnapshot"')).rows,
    ).toEqual(before);
    expect(
      (await client.query('SELECT content FROM "ConversationMessage"')).rows[0]
        .content,
    ).toBe("My original private conversation");
    expect(
      (await client.query('SELECT value FROM "Evidence"')).rows[0].value,
    ).toBe("My original goal");
    expect(
      (await client.query('SELECT "passwordHash" FROM "AdminUser"')).rows.every(
        (row) => row.passwordHash === "unchanged-password-hash",
      ),
    ).toBe(true);
    await expect(
      client.query('UPDATE "DiscoverySession" SET "planId"=$1 WHERE id=$2', [
        s3,
        s1,
      ]),
    ).rejects.toMatchObject({ code: "23503" });
  } finally {
    await client.query("SET search_path TO public");
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
  }
}, 30000);
