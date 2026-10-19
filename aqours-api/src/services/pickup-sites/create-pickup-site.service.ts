import type { DB } from "../../config/database.js";
import { create, event } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { coordinates } from "../../validators/common.js";

export async function createPickupSite(db: DB, req: CommandContext) {
  const input = req.body;
  coordinates(input);
  const doc = await create(db, "site", {
    ...input,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    active: input.active ?? true,
    demo: input.demo ?? false,
  });
  await event(db, req.actor.id, doc.id, "created", "Pickup site created");
  return doc;
}
