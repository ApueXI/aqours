import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createAdvisory } from "../services/advisories/create-advisory.service.js";
import { getCustomerAdvisory } from "../services/advisories/get-customer-advisory.service.js";
import { getStaffAdvisory } from "../services/advisories/get-staff-advisory.service.js";
import { listCustomerAdvisories } from "../services/advisories/list-customer-advisories.service.js";
import { listStaffAdvisories } from "../services/advisories/list-staff-advisories.service.js";
import { reviseAdvisory } from "../services/advisories/revise-advisory.service.js";
import { createAdvisoryInput } from "../validators/advisories/create-advisory.js";
import { reviseAdvisoryInput } from "../validators/advisories/revise-advisory.js";
import { commandContext } from "./context.js";

export function listCustomerAdvisoriesController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listCustomerAdvisories(db, commandContext(req));
}
export function getCustomerAdvisoryController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getCustomerAdvisory(db, commandContext(req));
}
export function listStaffAdvisoriesController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listStaffAdvisories(db, commandContext(req));
}
export function getStaffAdvisoryController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getStaffAdvisory(db, commandContext(req));
}
export function createAdvisoryController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createAdvisory(db, {
    ...commandContext(req),
    body: createAdvisoryInput(req.body),
  });
}
export function reviseAdvisoryController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviseAdvisory(db, {
    ...commandContext(req),
    body: reviseAdvisoryInput(req.body),
  });
}
