import type { DB } from "../../config/database.js";
import {
  create,
  event,
  get,
  now,
  own,
} from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function recordGuidanceChoice(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "guidance", String(req.params.id));
  own(doc, req.actor);
  const choice = await create(
    db,
    "guidance_choice",
    {
      guidanceId: doc.id,
      action: input.action,
      createdAt: now(),
      customerId: req.actor.id,
    },
    req.actor.id,
    doc.id,
  );
  await event(
    db,
    req.actor.id,
    doc.id,
    "choice",
    `Customer chose ${input.action}; no assistance request submitted`,
  );
  return { id: choice.id, action: choice.action, createdAt: choice.createdAt };
}
