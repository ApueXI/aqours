import type { Express } from "express";
import { transitionAdvisoryController } from "../controllers/advisory-lifecycle.controller.js";
import { route } from "../middleware/endpoint.js";
export function advisoryLifecycleRoutes(app: Express) {
  for (const action of ["publish", "lift"] as const)
    route(
      app,
      "post",
      `/staff/advisories/:id/${action}`,
      "admin",
      (db, req, res) => transitionAdvisoryController(db, req, res, action),
    );
}
