import { z } from "zod";
import type { DB } from "../../config/database.js";
import {
  all,
  event,
  get,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { changeTotal } from "../../repositories/stock.repository.js";
import { lockSession, sessionDetail } from "./stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import {
  id,
  instant,
  interval,
  text,
  totalLiters,
  zones,
} from "../../validators/common.js";
const sessionFields = {
  siteId: id,
  zoneIds: z.array(id).min(1).max(100),
  startsAt: instant,
  endsAt: instant,
  totalLiters,
  instructions: text,
  demo: z.boolean().optional(),
};

export async function reviewDistributionSession(db: DB, req: CommandContext) {
  const { siteId: _s, demo: _d } = sessionFields;
  const input = req.body;
  const doc = await lockSession(db, String(req.params.id));
  version(doc, input.expectedVersion);
  if (doc.status === "cancelled") fail(409, "Cancelled sessions cannot reopen");
  if (input.zoneIds) {
    await zones(db, input.zoneIds);
    const requests = (await all(db, "assistance")).filter(
      (v) =>
        v.details.sessionId === doc.id &&
        ["requested", "accepted", "scheduled", "in_progress"].includes(
          v.status,
        ),
    );
    for (const request of requests) {
      const report = await get(db, "report", request.reportId);
      if (!input.zoneIds.includes(report.zoneId))
        fail(409, "Cannot remove zones serving active requests");
    }
  }
  interval(input.startsAt ?? doc.startsAt, input.endsAt ?? doc.endsAt);
  if (input.totalLiters !== undefined) {
    await changeTotal(db, doc.id, input.totalLiters);
  }
  const { expectedVersion: _e, reason: _r, totalLiters: _l, ...patch } = input;
  await event(
    db,
    req.actor.id,
    doc.id,
    "reviewed",
    input.reason,
    undefined,
    undefined,
    false,
    {
      totalLiters: input.totalLiters,
    },
  );
  return sessionDetail(
    db,
    await save(db, "pickup_session", { ...doc, ...patch, updatedAt: now() }),
  );
}
