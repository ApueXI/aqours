import type { DB } from "../../config/database.js";
import { all, event, get, now } from "../../repositories/domain.repository.js";
import { advisoryLock } from "../../repositories/locks.repository.js";
import { published, reportCreate, reportSafe } from "./report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function markIncidentAffected(db: DB, req: CommandContext) {
  const input = req.body,
    incident = await get(db, "incident", String(req.params.id));
  if (!(await published(db, incident)))
    fail(404, "Published incident not found");
  await advisoryLock(
    db,
    `affected:${req.actor.id}:${input.connectionId}:${incident.id}`,
  );
  const existing = (await all(db, "report", req.actor.id)).find(
    (v) =>
      v.assertedIncidentId === incident.id &&
      v.connectionId === input.connectionId,
  );
  if (existing) return reportSafe(existing);
  const doc = await reportCreate(
    db,
    req.actor,
    {
      ...input,
      category: incident.category,
      description: "Customer marked affected by published incident",
      noticedAt: now(),
    },
    incident.id,
  );
  await event(
    db,
    req.actor.id,
    doc.id,
    "affected",
    "Customer marked affected",
    undefined,
    "received",
  );
  return reportSafe(doc);
}
