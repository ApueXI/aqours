import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createIncident } from "../services/incidents/create-incident.service.js";
import { getPublishedIncident } from "../services/incidents/get-published-incident.service.js";
import { getStaffIncident } from "../services/incidents/get-staff-incident.service.js";
import { listPublishedIncidents } from "../services/incidents/list-published-incidents.service.js";
import { listStaffIncidents } from "../services/incidents/list-staff-incidents.service.js";
import { reviewIncident } from "../services/incidents/review-incident.service.js";
import { createIncidentInput } from "../validators/incidents/create-incident.js";
import { reviewIncidentInput } from "../validators/incidents/review-incident.js";
import { commandContext } from "./context.js";

export function listPublishedIncidentsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listPublishedIncidents(db, commandContext(req));
}
export function getPublishedIncidentController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getPublishedIncident(db, commandContext(req));
}
export function listStaffIncidentsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listStaffIncidents(db, commandContext(req));
}
export function getStaffIncidentController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getStaffIncident(db, commandContext(req));
}
export function createIncidentController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createIncident(db, {
    ...commandContext(req),
    body: createIncidentInput(req.body),
  });
}
export function reviewIncidentController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewIncident(db, {
    ...commandContext(req),
    body: reviewIncidentInput(req.body),
  });
}
