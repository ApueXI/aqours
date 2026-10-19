import type { DB } from "../../config/database.js";
import {
  event,
  get,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import {
  advisoryFanout,
  advisoryRevision,
  qualityKinds,
} from "./advisory-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { zones } from "../../validators/common.js";

export async function reviseAdvisory(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "advisory", String(req.params.id), true);
  version(doc, input.expectedVersion);
  if (doc.state === "lifted") fail(409, "Lifted notices cannot be edited");
  if (input.zoneIds?.length) await zones(db, input.zoneIds);
  for (const connection of input.connectionIds ?? [])
    await get(db, "connection", connection);
  if (doc.state === "published" && qualityKinds.includes(doc.kind)) {
    if (
      (input.kind && input.kind !== doc.kind) ||
      (input.zoneIds &&
        JSON.stringify([...input.zoneIds].sort()) !==
          JSON.stringify([...doc.zoneIds].sort())) ||
      (input.connectionIds &&
        JSON.stringify([...input.connectionIds].sort()) !==
          JSON.stringify([...doc.connectionIds].sort()))
    )
      fail(
        409,
        "Explicitly lift quality restrictions before changing kind or targets",
      );
  }
  const { expectedVersion: _e, reason: _r, ...patch } = input;
  const revised = { ...doc, ...patch, updatedAt: now() };
  if (
    !(revised.zoneIds ?? doc.zoneIds).length &&
    !(revised.connectionIds ?? doc.connectionIds).length
  )
    fail(400, "Advisory requires explicit targets");
  if (revised.startsAt && revised.endsAt && revised.startsAt >= revised.endsAt)
    fail(400, "Invalid advisory interval");
  const result = await save(db, "advisory", revised);
  await advisoryRevision(
    db,
    result,
    doc.state === "published" ? "revised" : "draft",
  );
  await event(db, req.actor.id, doc.id, "revised", input.reason);
  if (doc.state === "published") await advisoryFanout(db, result, "revised");
  return result;
}
