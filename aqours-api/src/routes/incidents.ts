import type { Express } from "express";
import {
  createIncidentController,
  getPublishedIncidentController,
  getStaffIncidentController,
  listPublishedIncidentsController,
  listStaffIncidentsController,
  reviewIncidentController,
} from "../controllers/incidents.controller.js";
import { route } from "../middleware/endpoint.js";
import { incidentPublicationRoutes } from "./incident-publication.js";
export function incidentRoutes(app: Express) {
  route(app, "get", "/incidents", "any", listPublishedIncidentsController);
  route(app, "get", "/incidents/:id", "any", getPublishedIncidentController);
  route(app, "get", "/staff/incidents", "staff", listStaffIncidentsController);
  route(
    app,
    "get",
    "/staff/incidents/:id",
    "staff",
    getStaffIncidentController,
  );
  route(app, "post", "/staff/incidents", "staff", createIncidentController);
  route(
    app,
    "patch",
    "/staff/incidents/:id",
    "staff",
    reviewIncidentController,
  );
  incidentPublicationRoutes(app);
}
