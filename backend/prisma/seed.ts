import { db } from "../src/db.js";
import { config } from "../src/config.js";
import { hashPassword } from "../src/auth.js";
import { scenarios, seededCases } from "../src/library.js";
import { services } from "../../data/services.js";
import { json } from "../src/session-service.js";
try {
  if (config.ADMIN_PASSWORD.length < 12)
    throw new Error(
      "Set ADMIN_PASSWORD to at least 12 characters in the root .env before seeding.",
    );
  const passwordHash = await hashPassword(config.ADMIN_PASSWORD);
  await db.adminUser.upsert({
    where: { email: config.ADMIN_EMAIL },
    create: { email: config.ADMIN_EMAIL, passwordHash },
    update: { passwordHash },
  });
  for (const service of services)
    await db.service.upsert({
      where: { id: service.id },
      create: service,
      update: service,
    });
  for (const s of scenarios)
    await db.scenarioTemplate.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        title: s.title,
        industry: s.industry,
        definition: json(s),
      },
      update: { title: s.title, industry: s.industry, definition: json(s) },
    });
  for (const c of seededCases)
    await db.caseIntelligenceRecord.upsert({
      where: { id: c.id },
      create: { ...c, pattern: json(c.pattern) },
      update: {},
    });
  console.log(
    "Seeded admin, 13 services, 15 reference scenarios. No synthetic results are approved automatically.",
  );
} finally {
  await db.$disconnect();
}
