import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createZone } from "../services/settings/create-zone.service.js";
import { listAuditEvents } from "../services/settings/list-audit-events.service.js";
import { listGuidanceSettings } from "../services/settings/list-guidance-settings.service.js";
import { listSettingsZones } from "../services/settings/list-settings-zones.service.js";
import { publishGuidanceSettings } from "../services/settings/publish-guidance-settings.service.js";
import { reviewZone } from "../services/settings/review-zone.service.js";
import { createZoneInput } from "../validators/settings/create-zone.js";
import { publishGuidanceSettingsInput } from "../validators/settings/publish-guidance-settings.js";
import { reviewZoneInput } from "../validators/settings/review-zone.js";
import { commandContext } from "./context.js";

export function listSettingsZonesController(
  db: DB,
  _req: ActorRequest,
  _res: Response,
) {
  return listSettingsZones(db);
}
export function createZoneController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createZone(db, {
    ...commandContext(req),
    body: createZoneInput(req.body),
  });
}
export function reviewZoneController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewZone(db, {
    ...commandContext(req),
    body: reviewZoneInput(req.body),
  });
}
export function listGuidanceSettingsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  settings: string,
) {
  return listGuidanceSettings(db, commandContext(req), settings);
}
export function publishGuidanceSettingsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  settings: string,
) {
  return publishGuidanceSettings(
    db,
    {
      ...commandContext(req),
      body: publishGuidanceSettingsInput(req.body, settings),
    },
    settings,
  );
}
export function listAuditEventsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listAuditEvents(db, commandContext(req));
}
