import { createApp } from "./app.js";
import { prisma } from "./config/database.js";
import { config } from "./config/environment.js";
const server = createApp().listen(config.port, "0.0.0.0", () =>
  console.log(`Aqours API listening on port ${config.port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () =>
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0));
    }),
  );
