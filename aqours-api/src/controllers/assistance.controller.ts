import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { cancelAssistanceRequest } from "../services/assistance/cancel-assistance-request.service.js";
import { createAssistanceRequest } from "../services/assistance/create-assistance-request.service.js";
import { getAssistanceRequest } from "../services/assistance/get-assistance-request.service.js";
import { listAssistanceRequests } from "../services/assistance/list-assistance-requests.service.js";
import { listEligiblePickupSessions } from "../services/assistance/list-eligible-pickup-sessions.service.js";
import { cancelAssistanceRequestInput } from "../validators/assistance/cancel-assistance-request.js";
import { createAssistanceRequestInput } from "../validators/assistance/create-assistance-request.js";
import { commandContext } from "./context.js";

export function listEligiblePickupSessionsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listEligiblePickupSessions(db, commandContext(req));
}
export function createAssistanceRequestController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return createAssistanceRequest(db, {
    ...commandContext(req),
    body: createAssistanceRequestInput(req.body),
  });
}
export function listAssistanceRequestsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  staff: boolean,
) {
  return listAssistanceRequests(db, commandContext(req), staff);
}
export function getAssistanceRequestController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  staff: boolean,
) {
  return getAssistanceRequest(db, commandContext(req), staff);
}
export function cancelAssistanceRequestController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return cancelAssistanceRequest(db, {
    ...commandContext(req),
    body: cancelAssistanceRequestInput(req.body),
  });
}
