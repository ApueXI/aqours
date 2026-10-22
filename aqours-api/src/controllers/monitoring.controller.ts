import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { commandContext } from "./context.js";
import {
  siteForecast,
  queueSiteForecast,
} from "../services/monitoring/forecast.js";
import {
  configureSiteMonitoring,
  configureBands,
  temperatureBands,
} from "../services/monitoring/settings.js";
import {
  monitoringOverview,
  listMonitoringWarnings,
  monitoringWarningDetail,
  monitoringNotifications,
  readMonitoringNotification,
} from "../services/monitoring/reads.js";
export const overviewController = (db: DB) => monitoringOverview(db);
export const forecastController = (db: DB, req: ActorRequest) =>
  siteForecast(db, String(req.params.id));
export const refreshController = async (db: DB, req: ActorRequest) => ({
  queued: await queueSiteForecast(db, String(req.params.id)),
});
export const configureMonitoringController = (db: DB, req: ActorRequest) =>
  configureSiteMonitoring(db, commandContext(req));
export const bandsController = (db: DB) => temperatureBands(db);
export const configureBandsController = (db: DB, req: ActorRequest) =>
  configureBands(db, commandContext(req));
export const warningsController = (db: DB, req: ActorRequest) =>
  listMonitoringWarnings(db, commandContext(req));
export const warningController = (db: DB, req: ActorRequest) =>
  monitoringWarningDetail(db, String(req.params.id));
export const notificationsController = (db: DB, req: ActorRequest) =>
  monitoringNotifications(db, commandContext(req));
export const readNotificationController = (db: DB, req: ActorRequest) =>
  readMonitoringNotification(db, commandContext(req));
