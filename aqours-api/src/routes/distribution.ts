import type { Express } from "express";
import {
  cancelDistributionSessionController,
  createDistributionSessionController,
  listDistributionSessionsController,
  reviewDistributionSessionController,
} from "../controllers/distribution.controller.js";
import { route } from "../middleware/endpoint.js";
import { collectionRoutes } from "./collection.js";
import { pickupSiteRoutes } from "./pickup-sites.js";
export function distributionRoutes(app: Express) {
  route(
    app,
    "get",
    "/staff/distribution/sessions",
    "staff",
    listDistributionSessionsController,
  );
  route(
    app,
    "post",
    "/staff/distribution/sessions",
    "staff",
    createDistributionSessionController,
  );
  route(
    app,
    "patch",
    "/staff/distribution/sessions/:id",
    "staff",
    reviewDistributionSessionController,
  );
  route(
    app,
    "post",
    "/staff/distribution/sessions/:id/cancel",
    "staff",
    cancelDistributionSessionController,
  );
  pickupSiteRoutes(app);
  collectionRoutes(app);
}
