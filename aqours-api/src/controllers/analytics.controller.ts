import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { getMapReports } from "../services/analytics/get-map-reports.service.js";
import { getMetrics } from "../services/analytics/get-metrics.service.js";
import { commandContext } from "./context.js";

export function getMapReportsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getMapReports(db, commandContext(req));
}
export function getMetricsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getMetrics(db, commandContext(req));
}
