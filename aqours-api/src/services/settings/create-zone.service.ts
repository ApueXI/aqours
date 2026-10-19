import type { DB } from "../../config/database.js";
import { create, event } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function createZone(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await create(db, "zone", {
    ...input,
    boundary: input.boundary ?? null,
    active: input.active ?? true,
    demo: input.demo ?? false,
  });
  await event(
    db,
    req.actor.id,
    doc.id,
    "zone_created",
    "Zone created",
    undefined,
    undefined,
    true,
  );
  return doc;
}
