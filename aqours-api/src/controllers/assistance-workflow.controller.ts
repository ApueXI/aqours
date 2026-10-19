import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { addAssistanceNote } from "../services/assistance-workflow/add-assistance-note.service.js";
import { transitionAssistanceRequest } from "../services/assistance-workflow/transition-assistance-request.service.js";
import { addAssistanceNoteInput } from "../validators/assistance-workflow/add-assistance-note.js";
import { transitionAssistanceRequestInput } from "../validators/assistance-workflow/transition-assistance-request.js";
import { commandContext } from "./context.js";

export function transitionAssistanceRequestController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return transitionAssistanceRequest(db, {
    ...commandContext(req),
    body: transitionAssistanceRequestInput(req.body),
  });
}
export function addAssistanceNoteController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return addAssistanceNote(db, {
    ...commandContext(req),
    body: addAssistanceNoteInput(req.body),
  });
}
