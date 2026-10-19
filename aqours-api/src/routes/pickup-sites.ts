import type { Express } from "express";
import {
  createPickupSiteController,
  listPickupSitesController,
  reviewPickupSiteController,
} from "../controllers/pickup-sites.controller.js";
import { route } from "../middleware/endpoint.js";
export function pickupSiteRoutes(app: Express) {
  route(app, "get", "/staff/pickup-sites", "staff", listPickupSitesController);
  route(
    app,
    "post",
    "/staff/pickup-sites",
    "staff",
    createPickupSiteController,
  );
  route(
    app,
    "patch",
    "/staff/pickup-sites/:id",
    "staff",
    reviewPickupSiteController,
  );
}
