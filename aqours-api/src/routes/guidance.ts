import type { Express } from "express";
import {
  evaluateGuidanceController,
  getGuidanceController,
  getNotificationController,
  listNotificationsController,
  markNotificationReadController,
  recordGuidanceChoiceController,
} from "../controllers/guidance.controller.js";
import { route } from "../middleware/endpoint.js";
export function guidanceRoutes(app: Express) {
  route(
    app,
    "post",
    "/reports/:id/guidance",
    "customer",
    evaluateGuidanceController,
    false,
  );
  route(app, "get", "/guidance/:id", "customer", getGuidanceController);
  route(
    app,
    "post",
    "/guidance/:id/choice",
    "customer",
    recordGuidanceChoiceController,
  );
  route(app, "get", "/notifications", "customer", listNotificationsController);
  route(
    app,
    "get",
    "/notifications/:id",
    "customer",
    getNotificationController,
  );
  route(
    app,
    "patch",
    "/notifications/:id/read",
    "customer",
    markNotificationReadController,
    false,
  );
}
