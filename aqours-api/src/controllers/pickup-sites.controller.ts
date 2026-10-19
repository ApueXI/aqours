import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createPickupSite } from "../services/pickup-sites/create-pickup-site.service.js";
import { listPickupSites } from "../services/pickup-sites/list-pickup-sites.service.js";
import { reviewPickupSite } from "../services/pickup-sites/review-pickup-site.service.js";
import { createPickupSiteInput } from "../validators/pickup-sites/create-pickup-site.js";
import { reviewPickupSiteInput } from "../validators/pickup-sites/review-pickup-site.js";
import { commandContext } from "./context.js";

export function listPickupSitesController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listPickupSites(db, commandContext(req));
}
export function createPickupSiteController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createPickupSite(db, {
    ...commandContext(req),
    body: createPickupSiteInput(req.body),
  });
}
export function reviewPickupSiteController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewPickupSite(db, {
    ...commandContext(req),
    body: reviewPickupSiteInput(req.body),
  });
}
