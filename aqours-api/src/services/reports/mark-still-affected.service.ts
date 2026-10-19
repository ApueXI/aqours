import type { DB } from "../../config/database.js";
import {
  event,
  get,
  own,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { reportSafe } from "./report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function markStillAffected(db: DB, req: CommandContext) {
  const input = req.body,
    doc = await get(db, "report", String(req.params.id), true);
  own(doc, req.actor);
  version(doc, input.expectedVersion);
  if (doc.status !== "resolved")
    fail(409, "Only resolved reports can return to review");
  await event(
    db,
    req.actor.id,
    doc.id,
    "still_affected",
    input.reason,
    doc.status,
    "under_review",
  );
  return reportSafe(
    await save(db, "report", {
      ...doc,
      status: "under_review",
      closureOutcome: null,
      closureReason: null,
    }),
  );
}
