import type { DB } from "../../config/database.js";
import {
  event,
  get,
  save,
  version,
} from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { coordinates } from "../../validators/common.js";

export async function reviewPickupSite(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "site", String(req.params.id), true);
  version(doc, input.expectedVersion);
  const { expectedVersion: _e, reason: _r, ...patch } = input;
  const result = { ...doc, ...patch };
  coordinates(result);
  await event(db, req.actor.id, doc.id, "reviewed", input.reason);
  return save(db, "site", result);
}
