import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createAccount } from "../services/settings-accounts/create-account.service.js";
import { listAccounts } from "../services/settings-accounts/list-accounts.service.js";
import { reviewAccount } from "../services/settings-accounts/review-account.service.js";
import { createAccountInput } from "../validators/settings-accounts/create-account.js";
import { reviewAccountInput } from "../validators/settings-accounts/review-account.js";
import { commandContext } from "./context.js";

export function listAccountsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listAccounts(db, commandContext(req));
}
export function createAccountController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createAccount(db, {
    ...commandContext(req),
    body: createAccountInput(req.body),
  });
}
export function reviewAccountController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewAccount(db, {
    ...commandContext(req),
    body: reviewAccountInput(req.body),
  });
}
