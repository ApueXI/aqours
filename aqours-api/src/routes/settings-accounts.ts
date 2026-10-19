import type { Express } from "express";
import {
  createAccountController,
  listAccountsController,
  reviewAccountController,
} from "../controllers/settings-accounts.controller.js";
import { route } from "../middleware/endpoint.js";
export function accountSettingsRoutes(app: Express) {
  route(
    app,
    "get",
    "/staff/settings/accounts",
    "admin",
    listAccountsController,
  );
  route(
    app,
    "post",
    "/staff/settings/accounts",
    "admin",
    createAccountController,
  );
  route(
    app,
    "patch",
    "/staff/settings/accounts/:id",
    "admin",
    reviewAccountController,
  );
}
