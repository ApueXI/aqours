import { z } from "zod";
import type { DB } from "../../config/database.js";
import {
  event,
  get,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import {
  category,
  geometry,
  id,
  instant,
  staffOwner,
  text,
  zones,
} from "../../validators/common.js";
import { incidentDetail } from "./detail.service.js";
const content = {
  category,
  summary: text,
  zoneIds: z.array(id).min(1).max(100),
  area: text,
  ownerId: id.nullable().optional(),
  geometry: geometry.nullable().optional(),
  restorationAt: instant.nullable().optional(),
  estimatedAffected: z.number().int().nonnegative().nullable().optional(),
  estimateBasis: text.nullable().optional(),
  demo: z.boolean().optional(),
};
export async function reviewIncident(db: DB, req: CommandContext) {
  const { category: _c, demo: _d } = content;
  const input = req.body;
  const doc = await get(db, "incident", String(req.params.id), true);
  version(doc, input.expectedVersion);
  if (input.zoneIds) await zones(db, input.zoneIds);
  await staffOwner(db, input.ownerId);
  if (input.status && input.status !== doc.status) {
    const transitions: Record<string, string> = {
      investigating: "confirmed",
      confirmed: "work_in_progress",
      work_in_progress: "monitoring",
      monitoring: "resolved",
    };
    if (
      input.status !== "investigating" &&
      transitions[doc.status] !== input.status
    )
      fail(409, "Invalid incident transition");
  }
  const { expectedVersion: _e, reason: _r, ...patch } = input;
  if (
    patch.estimatedAffected != null &&
    !(patch.estimateBasis ?? doc.estimateBasis)
  )
    fail(400, "Affected estimate requires its basis");
  if (patch.estimatedAffected !== undefined) doc.estimateUpdatedAt = now();
  await event(
    db,
    req.actor.id,
    doc.id,
    "reviewed",
    input.reason,
    doc.status,
    input.status ?? doc.status,
    false,
    { changes: patch },
  );
  return incidentDetail(db, await save(db, "incident", { ...doc, ...patch }));
}
