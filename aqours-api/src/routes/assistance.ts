import type { Express } from "express";
import {
  cancelAssistanceRequestController,
  createAssistanceRequestController,
  getAssistanceRequestController,
  listAssistanceRequestsController,
  listEligiblePickupSessionsController,
} from "../controllers/assistance.controller.js";
import { route } from "../middleware/endpoint.js";
import { assistanceWorkflowRoutes } from "./assistance-workflow.js";
export function assistanceRoutes(app: Express) {
  route(
    app,
    "get",
    "/pickup-sessions",
    "customer",
    listEligiblePickupSessionsController,
  );
  route(
    app,
    "post",
    "/assistance-requests",
    "customer",
    createAssistanceRequestController,
  );
  for (const staff of [false, true]) {
    const prefix = staff
        ? "/staff/assistance-requests"
        : "/assistance-requests",
      access = staff ? "staff" : "customer";
    route(app, "get", prefix, access, (db, req, res) =>
      listAssistanceRequestsController(db, req, res, staff),
    );
    route(app, "get", prefix + "/:id", access, (db, req, res) =>
      getAssistanceRequestController(db, req, res, staff),
    );
  }
  route(
    app,
    "post",
    "/assistance-requests/:id/cancel",
    "customer",
    cancelAssistanceRequestController,
  );
  assistanceWorkflowRoutes(app);
}
