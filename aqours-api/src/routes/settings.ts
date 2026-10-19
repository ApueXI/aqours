import type { Express } from "express";
import {
  createZoneController,
  listAuditEventsController,
  listGuidanceSettingsController,
  listSettingsZonesController,
  publishGuidanceSettingsController,
  reviewZoneController,
} from "../controllers/settings.controller.js";
import { route } from "../middleware/endpoint.js";
import { accountSettingsRoutes } from "./settings-accounts.js";
import { connectionSettingsRoutes } from "./settings-connections.js";
export function settingsRoutes(app: Express) {
  route(
    app,
    "get",
    "/staff/settings/zones",
    "admin",
    listSettingsZonesController,
  );
  route(app, "post", "/staff/settings/zones", "admin", createZoneController);
  route(
    app,
    "patch",
    "/staff/settings/zones/:id",
    "admin",
    reviewZoneController,
  );
  for (const settings of ["guidance", "rules"] as const) {
    route(app, "get", "/staff/settings/" + settings, "staff", (db, req, res) =>
      listGuidanceSettingsController(db, req, res, settings),
    );
    route(app, "post", "/staff/settings/" + settings, "admin", (db, req, res) =>
      publishGuidanceSettingsController(db, req, res, settings),
    );
  }
  route(app, "get", "/staff/audit", "staff", listAuditEventsController);
  accountSettingsRoutes(app);
  connectionSettingsRoutes(app);
}
