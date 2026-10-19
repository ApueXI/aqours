import type { Express } from "express";
import {
  createAdvisoryController,
  getCustomerAdvisoryController,
  getStaffAdvisoryController,
  listCustomerAdvisoriesController,
  listStaffAdvisoriesController,
  reviseAdvisoryController,
} from "../controllers/advisories.controller.js";
import { route } from "../middleware/endpoint.js";
import { advisoryLifecycleRoutes } from "./advisory-lifecycle.js";
export function advisoryRoutes(app: Express) {
  route(
    app,
    "get",
    "/advisories",
    "customer",
    listCustomerAdvisoriesController,
  );
  route(
    app,
    "get",
    "/advisories/:id",
    "customer",
    getCustomerAdvisoryController,
  );
  route(
    app,
    "get",
    "/staff/advisories",
    "staff",
    listStaffAdvisoriesController,
  );
  route(
    app,
    "get",
    "/staff/advisories/:id",
    "staff",
    getStaffAdvisoryController,
  );
  route(app, "post", "/staff/advisories", "admin", createAdvisoryController);
  route(
    app,
    "patch",
    "/staff/advisories/:id",
    "admin",
    reviseAdvisoryController,
  );
  advisoryLifecycleRoutes(app);
}
