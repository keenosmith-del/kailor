import { purgeExpiredGuests } from "./guest-lifecycle.js";
import { app } from "./app.js";
import { config, logger } from "./config.js";
import { db } from "./db.js";
const server = app.listen(config.PORT, config.HOST, () =>
  logger.info("server.ready", { host: config.HOST, port: config.PORT }),
);
const cleanup = () =>
  void purgeExpiredGuests().catch(() => logger.error("guest.cleanup_failed"));
cleanup();
const cleanupTimer = setInterval(cleanup, 15 * 60 * 1000);
cleanupTimer.unref();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    clearInterval(cleanupTimer);
    server.close(() => void db.$disconnect().then(() => process.exit(0)));
  });
