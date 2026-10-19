import {
  all,
  get,
  timeline,
  type Doc,
} from "../../repositories/domain.repository.js";
import { reportSafe, updateSafe } from "../reports/report-context.service.js";
export async function incidentDetail(
  db: Parameters<typeof get>[0],
  doc: Doc,
  full = false,
) {
  const reports = (await all(db, "report")).filter(
    (v) => v.incidentId === doc.id,
  );
  const updates = (await all(db, "incident_update"))
    .filter((v) => v.incidentId === doc.id)
    .map(updateSafe);
  return {
    ...doc,
    updates,
    reportCount: reports.length,
    uniqueConnections: new Set(reports.map((v) => v.connectionId)).size,
    ...(full
      ? {
          reports: reports.map(reportSafe),
          notes: (await timeline(db, doc.id, true)).map((v) => ({
            ...v,
            authorId: v.actorId,
          })),
          timeline: await timeline(db, doc.id),
        }
      : {}),
  };
}
