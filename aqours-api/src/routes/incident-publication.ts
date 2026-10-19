import type { Express } from "express";
import {
  addIncidentNoteController,
  publishIncidentUpdateController,
} from "../controllers/incident-publication.controller.js";
import { route } from "../middleware/endpoint.js";
export function incidentPublicationRoutes(app: Express) {
  route(
    app,
    "post",
    "/staff/incidents/:id/notes",
    "staff",
    addIncidentNoteController,
  );
  route(
    app,
    "post",
    "/staff/incidents/:id/updates",
    "staff",
    publishIncidentUpdateController,
  );
}
