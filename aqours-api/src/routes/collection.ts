import type { Express } from "express";
import { collectWaterAllocationController } from "../controllers/collection.controller.js";
import { route } from "../middleware/endpoint.js";
export function collectionRoutes(app: Express) {
  route(
    app,
    "post",
    "/staff/water-allocations/:id/collect",
    "staff",
    collectWaterAllocationController,
  );
}
