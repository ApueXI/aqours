import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { addReportMessage } from "../services/reports/add-report-message.service.js";
import { createReport } from "../services/reports/create-report.service.js";
import { geocodeLocation } from "../services/reports/geocode-location.service.js";
import { getReport } from "../services/reports/get-report.service.js";
import { listReports } from "../services/reports/list-reports.service.js";
import { markIncidentAffected } from "../services/reports/mark-incident-affected.service.js";
import { markStillAffected } from "../services/reports/mark-still-affected.service.js";
import { addReportMessageInput } from "../validators/reports/add-report-message.js";
import { createReportInput } from "../validators/reports/create-report.js";
import { geocodeInput } from "../validators/reports/geocode-location.js";
import { markIncidentAffectedInput } from "../validators/reports/mark-incident-affected.js";
import { markStillAffectedInput } from "../validators/reports/mark-still-affected.js";
import { commandContext } from "./context.js";

export function geocodeLocationController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return geocodeLocation(db, {
    ...commandContext(req),
    body: geocodeInput.parse(req.body),
  });
}
export function createReportController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createReport(db, {
    ...commandContext(req),
    body: createReportInput(req.body),
  });
}
export function listReportsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  staff: boolean,
) {
  return listReports(db, commandContext(req), staff);
}
export function getReportController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  staff: boolean,
) {
  return getReport(db, commandContext(req), staff);
}
export function addReportMessageController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  staff: boolean,
) {
  return addReportMessage(
    db,
    { ...commandContext(req), body: addReportMessageInput(req.body, staff) },
    staff,
  );
}
export function markStillAffectedController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return markStillAffected(db, {
    ...commandContext(req),
    body: markStillAffectedInput(req.body),
  });
}
export function markIncidentAffectedController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return markIncidentAffected(db, {
    ...commandContext(req),
    body: markIncidentAffectedInput(req.body),
  });
}
