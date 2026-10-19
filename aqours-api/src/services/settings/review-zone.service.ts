import { z } from "zod";
import type { DB } from "../../config/database.js";
import {
  all,
  event,
  get,
  save,
  version,
} from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { geometry, short } from "../../validators/common.js";
const zoneFields = {
  name: short,
  boundary: geometry.nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};

export async function reviewZone(db: DB, req: CommandContext) {
  const { demo: _d } = zoneFields;
  const input = req.body;
  const doc = await get(db, "zone", String(req.params.id), true);
  version(doc, input.expectedVersion);
  if (input.active === false) {
    const connections = (await all(db, "connection")).some(
      (v) => v.zoneId === doc.id,
    );
    const reports = (await all(db, "report")).some(
      (v) => v.zoneId === doc.id && v.status !== "resolved",
    );
    const incidents = (await all(db, "incident")).some(
      (v) => v.zoneIds.includes(doc.id) && v.status !== "resolved",
    );
    const advisories = (await all(db, "advisory")).some(
      (v) => v.zoneIds.includes(doc.id) && v.state === "published",
    );
    const sessions = (await all(db, "pickup_session")).some(
      (v) => v.zoneIds.includes(doc.id) && v.status === "open",
    );
    if (connections || reports || incidents || advisories || sessions)
      fail(409, "Zone has active references");
  }
  const { expectedVersion: _e, reason: _r, ...fields } = input;
  await event(
    db,
    req.actor.id,
    doc.id,
    "zone_updated",
    input.reason,
    undefined,
    undefined,
    true,
  );
  return save(db, "zone", { ...doc, ...fields });
}
