import { db } from "../backend/src/db.js";
import { config } from "../backend/src/config.js";
// Never create an account or grant a guest privileges. Preserve the explicitly configured founder only.
try {
  const email = config.ADMIN_EMAIL.trim().toLowerCase();
  const account = await db.adminUser.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, isGuest: false },
  });
  if (account && account.role !== "admin") {
    await db.adminUser.update({
      where: { id: account.id },
      data: { role: "admin", email },
    });
    console.log("Preserved the configured existing founder's access.");
  }
} finally {
  await db.$disconnect();
}
