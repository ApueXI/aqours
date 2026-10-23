import { changePassword } from "../services/auth/change-password.service.js";
import { commandContext } from "../controllers/context.js";
import type { Express } from "express";
import { login, logout } from "../controllers/auth.controller.js";
import {
  sessionController,
  profileController,
  connectionsController,
  zonesController,
  staffZonesController,
  operatorsController,
  staffConnectionsController,
} from "../controllers/identity.controller.js";
import { route } from "../middleware/endpoint.js";

export function authRoutes(app: Express) {
  app.post("/api/v1/auth/login", login);
  app.post("/api/v1/auth/logout", logout);
  route(app, "get", "/auth/session", "any", sessionController);
  route(app, "post", "/me/password", "any", (db, req) => changePassword(db, commandContext(req)));
  route(app, "get", "/me", "any", profileController);
  route(app, "get", "/me/connections", "customer", connectionsController);
  route(app, "get", "/zones", "any", zonesController);
  route(app, "get", "/staff/zones", "staff", staffZonesController);
  route(app, "get", "/staff/users", "staff", operatorsController);
  route(app, "get", "/staff/connections", "staff", staffConnectionsController);
}
