import express from "express";
import { securityHeadersAndRateLimit } from "./middleware/security.js";
import { advisoryRoutes } from "./routes/advisories.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { assistanceRoutes } from "./routes/assistance.js";
import { attachmentRoutes } from "./routes/attachments.js";
import { authRoutes } from "./routes/auth.js";
import { distributionRoutes } from "./routes/distribution.js";
import { guidanceRoutes } from "./routes/guidance.js";
import { incidentRoutes } from "./routes/incidents.js";
import { reportRoutes } from "./routes/reports.js";
import { settingsRoutes } from "./routes/settings.js";
import { weatherRoutes } from "./routes/weather.js";
import { errorHandler, fail } from "./utils/errors.js";
export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeadersAndRateLimit);
  app.use(express.json({ limit: "128kb", strict: true }));
  app.get("/health", (_req, res) => res.json({ data: { status: "ok" } }));
  authRoutes(app);
  reportRoutes(app);
  incidentRoutes(app);
  advisoryRoutes(app);
  assistanceRoutes(app);
  distributionRoutes(app);
  settingsRoutes(app);
  guidanceRoutes(app);
  analyticsRoutes(app);
  attachmentRoutes(app);
  weatherRoutes(app);
  app.use((_req, _res, next) => {
    try {
      fail(404, "Endpoint not found", "not_found");
    } catch (error) {
      next(error);
    }
  });
  app.use(errorHandler);
  return app;
}
