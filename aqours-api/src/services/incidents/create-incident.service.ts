import type { DB } from "../../config/database.js";
import { create, event, now } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { staffOwner, zones } from "../../validators/common.js";
import { incidentDetail } from "./detail.service.js";
export async function createIncident(db: DB, req: CommandContext) {
  const input = req.body;
  await zones(db, input.zoneIds);
  await staffOwner(db, input.ownerId);
  if (input.estimatedAffected != null && !input.estimateBasis)
    fail(400, "Affected estimate requires its basis");
  const result = await create(db, "incident", {
    ...input,
    status: "investigating",
    ownerId: input.ownerId ?? null,
    geometry: input.geometry ?? null,
    restorationAt: input.restorationAt ?? null,
    estimatedAffected: input.estimatedAffected ?? null,
    estimateBasis: input.estimateBasis ?? null,
    estimateUpdatedAt: input.estimatedAffected != null ? now() : null,
    demo: input.demo ?? false,
    createdAt: now(),
  });
  await event(
    db,
    req.actor.id,
    result.id,
    "created",
    "Incident created",
    undefined,
    "investigating",
  );
  return incidentDetail(db, result);
}
