import type { DB } from "../../config/database.js";
import {
  create,
  event,
  get,
  now,
} from "../../repositories/domain.repository.js";
import { insertStock } from "../../repositories/stock.repository.js";
import { sessionDetail } from "./stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { interval, zones } from "../../validators/common.js";

export async function createDistributionSession(db: DB, req: CommandContext) {
  const input = req.body;
  interval(input.startsAt, input.endsAt);
  await zones(db, input.zoneIds);
  const site = await get(db, "site", input.siteId);
  if (!site.active) fail(400, "Pickup site is inactive");
  const { totalLiters: amount, ...fields } = input;
  const doc = await create(
    db,
    "pickup_session",
    { ...fields, status: "open", demo: input.demo ?? false, updatedAt: now() },
    null,
    site.id,
  );
  await insertStock(db, doc.id, amount);
  await event(
    db,
    req.actor.id,
    doc.id,
    "created",
    `Session created with ${amount} liters`,
  );
  return sessionDetail(db, doc);
}
