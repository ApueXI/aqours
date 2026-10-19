import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { createConnection } from "../services/settings-connections/create-connection.service.js";
import { listConnections } from "../services/settings-connections/list-connections.service.js";
import { reviewConnection } from "../services/settings-connections/review-connection.service.js";
import { createConnectionInput } from "../validators/settings-connections/create-connection.js";
import { reviewConnectionInput } from "../validators/settings-connections/review-connection.js";
import { commandContext } from "./context.js";

export function listConnectionsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listConnections(db, commandContext(req));
}
export function createConnectionController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createConnection(db, {
    ...commandContext(req),
    body: createConnectionInput(req.body),
  });
}
export function reviewConnectionController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewConnection(db, {
    ...commandContext(req),
    body: reviewConnectionInput(req.body),
  });
}
