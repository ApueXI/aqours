import type { DB } from "../../config/database.js";
import { event, get, now } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function addIncidentNote(db: DB, req: CommandContext) {
  const input = req.body,
    doc = await get(db, "incident", String(req.params.id));
  return {
    id: await event(
      db,
      req.actor.id,
      doc.id,
      "note",
      input.text,
      undefined,
      undefined,
      true,
    ),
    text: input.text,
    authorId: req.actor.id,
    createdAt: now(),
  };
}
