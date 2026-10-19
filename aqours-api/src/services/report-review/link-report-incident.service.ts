import type { DB } from "../../config/database.js";
import {
  event,
  get,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { reportSafe } from "../reports/report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";

export async function linkReportIncident(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "report", String(req.params.id), true);
  version(doc, input.expectedVersion);
  if (input.incidentId) await get(db, "incident", input.incidentId);
  await event(
    db,
    req.actor.id,
    doc.id,
    "incident_link",
    input.reason,
    undefined,
    undefined,
    false,
    { oldIncidentId: doc.incidentId, newIncidentId: input.incidentId },
  );
  return reportSafe(
    await save(db, "report", { ...doc, incidentId: input.incidentId }),
  );
}
