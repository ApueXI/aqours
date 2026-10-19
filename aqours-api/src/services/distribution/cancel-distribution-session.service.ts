import type { DB } from "../../config/database.js";
import {
  all,
  event,
  get,
  notify,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { releaseAllocation } from "../../repositories/stock.repository.js";
import {
  allocation,
  lockSession,
  sessionDetail,
} from "./stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function cancelDistributionSession(db: DB, req: CommandContext) {
  const input = req.body;
  const doc = await lockSession(db, String(req.params.id));
  version(doc, input.expectedVersion);
  if (doc.status === "cancelled") fail(409, "Session is already cancelled");
  const candidates = (await all(db, "assistance"))
    .filter((v) => v.type === "water_support" && v.details.sessionId === doc.id)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const candidate of candidates) {
    const request = await get(db, "assistance", candidate.id, true),
      reserved = await allocation(db, request.id, true);
    if (
      reserved?.state === "collected" ||
      !["requested", "accepted", "scheduled", "in_progress"].includes(
        request.status,
      )
    )
      continue;
    if (reserved?.state === "reserved")
      await releaseAllocation(db, reserved.id);
    const key = await event(
      db,
      req.actor.id,
      request.id,
      "session_cancelled",
      input.reason,
      request.status,
      "unavailable",
    );
    await save(db, "assistance", {
      ...request,
      status: "unavailable",
      reason: input.reason,
      nextSteps:
        "Contact supplier support for an alternative pickup arrangement.",
      updatedAt: now(),
    });
    await notify(
      db,
      request.customerId,
      key,
      "assistance",
      request.id,
      "Pickup session cancelled",
      `${input.reason} Contact supplier support for an alternative.`,
    );
  }
  await event(
    db,
    req.actor.id,
    doc.id,
    "cancelled",
    input.reason,
    doc.status,
    "cancelled",
  );
  return sessionDetail(
    db,
    await save(db, "pickup_session", {
      ...doc,
      status: "cancelled",
      updatedAt: now(),
    }),
  );
}
