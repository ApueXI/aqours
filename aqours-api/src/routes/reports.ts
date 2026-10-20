import {
  psgcRegionsController,
  psgcChildrenController,
} from "../controllers/locations.controller.js";
import type { Express } from "express";
import {
  addReportMessageController,
  createReportController,
  geocodeLocationController,
  getReportController,
  listReportsController,
  markIncidentAffectedController,
  markStillAffectedController,
} from "../controllers/reports.controller.js";
import { route } from "../middleware/endpoint.js";
import { reportReviewRoutes } from "./report-review.js";
export function reportRoutes(app: Express) {
  route(app, "get", "/locations/psgc/regions", "any", psgcRegionsController);
  route(app, "get", "/locations/psgc/children", "any", psgcChildrenController);
  route(
    app,
    "post",
    "/locations/geocode",
    "customer",
    geocodeLocationController,
    false,
  );
  route(app, "post", "/reports", "customer", createReportController);
  for (const staff of [false, true]) {
    const prefix = staff ? "/staff/reports" : "/reports",
      access = staff ? "staff" : "customer";
    route(app, "get", prefix, access, (db, req, res) =>
      listReportsController(db, req, res, staff),
    );
    route(app, "get", prefix + "/:id", access, (db, req, res) =>
      getReportController(db, req, res, staff),
    );
    route(app, "post", prefix + "/:id/messages", access, (db, req, res) =>
      addReportMessageController(db, req, res, staff),
    );
  }
  route(
    app,
    "post",
    "/reports/:id/still-affected",
    "customer",
    markStillAffectedController,
  );
  route(
    app,
    "post",
    "/incidents/:id/affected",
    "customer",
    markIncidentAffectedController,
  );
  reportReviewRoutes(app);
}
