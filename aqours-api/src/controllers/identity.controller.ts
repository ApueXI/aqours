import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { userSafe } from "../repositories/domain.repository.js";
import {
  connections,
  operators,
  zones,
} from "../services/auth/identity.service.js";

export const sessionController = async (_db: DB, req: ActorRequest) => ({
  user: userSafe(req.actor),
  ...(req.session.client === "web" ? { csrfToken: req.session.csrf } : {}),
});
export const profileController = async (_db: DB, req: ActorRequest) =>
  userSafe(req.actor);
export const connectionsController = (db: DB, req: ActorRequest) =>
  connections(db, req.actor.id);
export const zonesController = (db: DB) => zones(db);
export const staffZonesController = (db: DB) => zones(db, true);
export const operatorsController = (db: DB) => operators(db);
export const staffConnectionsController = (db: DB) => connections(db);
