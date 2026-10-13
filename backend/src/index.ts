import { app } from "./app.js";
import { config, logger } from "./config.js";
import { db } from "./db.js";
const server = app.listen(config.PORT, config.HOST, () =>
  logger.info("server.ready", { host: config.HOST, port: config.PORT }),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => void db.$disconnect().then(() => process.exit(0)));
  });
