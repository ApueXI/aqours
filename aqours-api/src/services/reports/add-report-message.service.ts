import type { DB } from "../../config/database.js";
import {
  create,
  event,
  get,
  notify,
  now,
  own,
  save,
} from "../../repositories/domain.repository.js";
import { messageSafe } from "../presentation/projection.js";
import type { CommandContext } from "../../types/command-context.js";

export async function addReportMessage(
  db: DB,
  req: CommandContext,
  staff: boolean,
) {
  const input = req.body,
    doc = await get(db, "report", String(req.params.id), true);
  if (!staff) own(doc, req.actor);
  const message = await create(
    db,
    "message",
    {
      reportId: doc.id,
      text: input.text,
      authorId: req.actor.id,
      authorRole: req.actor.role,
      createdAt: now(),
    },
    doc.customerId,
    doc.id,
  );
  await event(db, req.actor.id, doc.id, "message", input.text);
  if (staff) {
    if (!doc.firstRespondedAt) {
      doc.firstRespondedAt = now();
      await save(db, "report", doc);
    }
    await notify(
      db,
      doc.customerId,
      message.id,
      "report",
      doc.id,
      "Supplier response",
      input.text,
    );
  }
  return messageSafe(message);
}
