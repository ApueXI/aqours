import { addressFields } from "../location/psgc-catalog.service.js";
import type { DB } from "../../config/database.js";
import {
  event,
  get,
  save,
  version,
} from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { coordinates } from "../../validators/common.js";

export async function reviewConnection(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "connection", String(req.params.id), true);
  version(doc, input.expectedVersion);
  const { expectedVersion: _e, reason: _r, ...fields } = input,
    revised = { ...doc, ...fields, ...addressFields(fields, doc) };
  coordinates(revised);
  if (revised.zoneId) {
    const zone = await get(db, "zone", revised.zoneId, true);
    if (!zone.active) fail(400, "Zone is inactive");
  }
  if (revised.zoneConfirmed && !revised.zoneId)
    fail(400, "A confirmed zone requires a zone");
  await event(
    db,
    req.actor.id,
    doc.id,
    "connection_updated",
    input.reason,
    undefined,
    undefined,
    true,
  );
  return save(db, "connection", revised);
}
