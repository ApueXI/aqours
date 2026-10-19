import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { cancelDistributionSession } from "../services/distribution/cancel-distribution-session.service.js";
import { createDistributionSession } from "../services/distribution/create-distribution-session.service.js";
import { listDistributionSessions } from "../services/distribution/list-distribution-sessions.service.js";
import { reviewDistributionSession } from "../services/distribution/review-distribution-session.service.js";
import { cancelDistributionSessionInput } from "../validators/distribution/cancel-distribution-session.js";
import { createDistributionSessionInput } from "../validators/distribution/create-distribution-session.js";
import { reviewDistributionSessionInput } from "../validators/distribution/review-distribution-session.js";
import { commandContext } from "./context.js";

export function listDistributionSessionsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listDistributionSessions(db, commandContext(req));
}
export function createDistributionSessionController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createDistributionSession(db, {
    ...commandContext(req),
    body: createDistributionSessionInput(req.body),
  });
}
export function reviewDistributionSessionController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return reviewDistributionSession(db, {
    ...commandContext(req),
    body: reviewDistributionSessionInput(req.body),
  });
}
export function cancelDistributionSessionController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return cancelDistributionSession(db, {
    ...commandContext(req),
    body: cancelDistributionSessionInput(req.body),
  });
}
