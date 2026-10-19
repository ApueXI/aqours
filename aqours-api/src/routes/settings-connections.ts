import type { Express } from "express";
import {
  createConnectionController,
  listConnectionsController,
  reviewConnectionController,
} from "../controllers/settings-connections.controller.js";
import { route } from "../middleware/endpoint.js";
export function connectionSettingsRoutes(app: Express) {
  route(
    app,
    "get",
    "/staff/settings/connections",
    "admin",
    listConnectionsController,
  );
  route(
    app,
    "post",
    "/staff/settings/connections",
    "admin",
    createConnectionController,
  );
  route(
    app,
    "patch",
    "/staff/settings/connections/:id",
    "admin",
    reviewConnectionController,
  );
}
