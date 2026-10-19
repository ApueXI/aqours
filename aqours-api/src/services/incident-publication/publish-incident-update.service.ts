import type { DB } from "../../config/database.js";
import {
  all,
  create,
  event,
  get,
  notify,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { updateSafe } from "../reports/report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";

export async function publishIncidentUpdate(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "incident", String(req.params.id), true);
  version(doc, input.expectedVersion);
  const update = await create(
    db,
    "incident_update",
    {
      incidentId: doc.id,
      category: doc.category,
      summary: doc.summary,
      zoneIds: doc.zoneIds,
      status: doc.status,
      progress: input.progress,
      area: input.area,
      restorationAt: input.restorationAt,
      geometry: input.geometry ?? doc.geometry,
      publishedAt: now(),
      demo: doc.demo,
    },
    null,
    doc.id,
  );
  await save(db, "incident", {
    ...doc,
    area: input.area,
    restorationAt: input.restorationAt,
    geometry: input.geometry ?? doc.geometry,
  });
  await event(db, req.actor.id, doc.id, "published", input.progress);
  const recipients = new Set(
    (await all(db, "report"))
      .filter((v) => v.incidentId === doc.id)
      .map((v) => v.customerId),
  );
  for (const customer of recipients)
    await notify(
      db,
      customer,
      update.id,
      "incident",
      doc.id,
      doc.demo ? "Demo incident update" : "Incident update",
      input.progress,
    );
  return updateSafe(update);
}
