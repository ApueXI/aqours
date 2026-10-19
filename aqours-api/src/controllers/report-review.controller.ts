import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { addReportNote } from "../services/report-review/add-report-note.service.js";
import { linkReportIncident } from "../services/report-review/link-report-incident.service.js";
import { reviewReport } from "../services/report-review/review-report.service.js";
import { addReportNoteInput } from "../validators/report-review/add-report-note.js";
import { linkReportIncidentInput } from "../validators/report-review/link-report-incident.js";
import { reviewReportInput } from "../validators/report-review/review-report.js";
import { commandContext } from "./context.js";

export function reviewReportController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewReport(db, {
    ...commandContext(req),
    body: reviewReportInput(req.body),
  });
}
export function linkReportIncidentController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return linkReportIncident(db, {
    ...commandContext(req),
    body: linkReportIncidentInput(req.body),
  });
}
export function addReportNoteController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return addReportNote(db, {
    ...commandContext(req),
    body: addReportNoteInput(req.body),
  });
}
