import type { DB } from "../../config/database.js";
import {
  event,
  get,
  notify,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { reportSafe } from "../reports/report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { staffOwner } from "../../validators/common.js";

export async function reviewReport(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await get(db, "report", String(req.params.id), true);
  version(doc, input.expectedVersion);
  await staffOwner(db, input.ownerId);
  const finalZone = { ...doc, ...input };
  if (finalZone.zoneConfirmed && !finalZone.zoneId)
    fail(400, "Confirmed zone requires a zone");
  if (finalZone.zoneId) {
    const zone = await get(db, "zone", finalZone.zoneId, true);
    if (!zone.active) fail(400, "Selected service zone is inactive");
  }
  if (input.status && input.status !== doc.status) {
    const next: Record<string, string> = {
      received: "under_review",
      under_review: "in_progress",
      in_progress: "resolved",
    };
    const reviewed =
      input.status === "resolved" &&
      ["duplicate", "invalid"].includes(input.closureOutcome ?? "") &&
      doc.status !== "resolved";
    if (next[doc.status] !== input.status && !reviewed)
      fail(409, "Invalid report transition");
    if (input.status === "resolved") {
      if (!input.closureOutcome) fail(400, "Closure outcome is required");
      doc.closureOutcome = input.closureOutcome;
      doc.closureReason = input.reason;
      if (input.closureOutcome === "restored" && !doc.firstResolvedAt)
        doc.firstResolvedAt = now();
    }
  } else if (input.closureOutcome)
    fail(400, "Closure outcome requires resolution transition");
  const oldStatus = doc.status;
  const { expectedVersion: _e, reason: _r, ...patch } = input;
  if (patch.priority) doc.priorityReason = input.reason;
  Object.assign(doc, patch);
  if (input.zoneId !== undefined || input.zoneConfirmed !== undefined)
    doc.locationReview = !doc.zoneConfirmed || doc.latitude == null;
  const result = await save(db, "report", doc);
  const key = await event(
    db,
    req.actor.id,
    doc.id,
    "reviewed",
    input.reason,
    oldStatus,
    result.status,
    false,
    { changes: patch },
  );
  await notify(
    db,
    doc.customerId,
    key,
    "report",
    doc.id,
    "Report reviewed",
    `Status: ${result.status}. ${input.reason}`,
  );
  return reportSafe(result);
}
