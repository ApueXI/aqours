import type { DB } from "../../config/database.js";
import { create, event, get } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { coordinates } from "../../validators/common.js";

export async function createConnection(db: DB, req: CommandContext) {
  const input = req.body;
  const user = await get(db, "user", input.customerId);
  if (user.role !== "customer")
    fail(400, "Connections require a customer account");
  if (input.zoneId) {
    const zone = await get(db, "zone", input.zoneId, true);
    if (!zone.active) fail(400, "Zone is inactive");
  }
  if (input.zoneConfirmed && !input.zoneId)
    fail(400, "A confirmed zone requires a zone");
  coordinates(input);
  const doc = await create(
    db,
    "connection",
    {
      ...input,
      zoneId: input.zoneId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
    user.id,
  );
  await event(
    db,
    req.actor.id,
    doc.id,
    "connection_created",
    "Connection provisioned",
    undefined,
    undefined,
    true,
  );
  return doc;
}
