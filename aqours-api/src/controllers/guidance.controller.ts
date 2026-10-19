import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { evaluateGuidance } from "../services/guidance/evaluate-guidance.service.js";
import { getGuidance } from "../services/guidance/get-guidance.service.js";
import { getNotification } from "../services/guidance/get-notification.service.js";
import { listNotifications } from "../services/guidance/list-notifications.service.js";
import { markNotificationRead } from "../services/guidance/mark-notification-read.service.js";
import { recordGuidanceChoice } from "../services/guidance/record-guidance-choice.service.js";
import { evaluateGuidanceInput } from "../validators/guidance/evaluate-guidance.js";
import { recordGuidanceChoiceInput } from "../validators/guidance/record-guidance-choice.js";
import { commandContext } from "./context.js";

export function evaluateGuidanceController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return evaluateGuidance(db, {
    ...commandContext(req),
    body: evaluateGuidanceInput(req.body),
  });
}
export function getGuidanceController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getGuidance(db, commandContext(req));
}
export function recordGuidanceChoiceController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return recordGuidanceChoice(db, {
    ...commandContext(req),
    body: recordGuidanceChoiceInput(req.body),
  });
}
export function listNotificationsController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return listNotifications(db, commandContext(req));
}
export function getNotificationController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return getNotification(db, commandContext(req));
}
export function markNotificationReadController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return markNotificationRead(db, commandContext(req));
}
