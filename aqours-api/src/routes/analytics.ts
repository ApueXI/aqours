import type { Express } from "express";
import {
  getMapReportsController,
  getMetricsController,
} from "../controllers/analytics.controller.js";
import { route } from "../middleware/endpoint.js";
export function analyticsRoutes(app: Express) {
  route(app, "get", "/staff/map/reports", "staff", getMapReportsController);
  route(app, "get", "/staff/metrics", "staff", getMetricsController);
}
