import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { addIncidentNote } from "../services/incident-publication/add-incident-note.service.js";
import { publishIncidentUpdate } from "../services/incident-publication/publish-incident-update.service.js";
import { addIncidentNoteInput } from "../validators/incident-publication/add-incident-note.js";
import { publishIncidentUpdateInput } from "../validators/incident-publication/publish-incident-update.js";
import { commandContext } from "./context.js";

export function addIncidentNoteController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return addIncidentNote(db, {
    ...commandContext(req),
    body: addIncidentNoteInput(req.body),
  });
}
export function publishIncidentUpdateController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return publishIncidentUpdate(db, {
    ...commandContext(req),
    body: publishIncidentUpdateInput(req.body),
  });
}
