import type { Express } from "express";
import {
  addReportNoteController,
  linkReportIncidentController,
  reviewReportController,
} from "../controllers/report-review.controller.js";
import { route } from "../middleware/endpoint.js";
export function reportReviewRoutes(app: Express) {
  route(app, "patch", "/staff/reports/:id", "staff", reviewReportController);
  route(
    app,
    "post",
    "/staff/reports/:id/link",
    "staff",
    linkReportIncidentController,
  );
  route(
    app,
    "post",
    "/staff/reports/:id/notes",
    "staff",
    addReportNoteController,
  );
}
