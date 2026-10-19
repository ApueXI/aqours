import type { DB } from "../../config/database.js";
import {
  event,
  notify,
  now,
  own,
  save,
  version,
} from "../../repositories/domain.repository.js";
import { lockRequest, release, requestDetail } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function cancelAssistanceRequest(db: DB, req: CommandContext) {
  const input = req.body;
  const { request, session, reserved } = await lockRequest(
    db,
    String(req.params.id),
  );
  own(request, req.actor);
  version(request, input.expectedVersion);
  if (
    request.startedAt ||
    !["requested", "accepted", "scheduled"].includes(request.status)
  )
    fail(409, "Work has begun or request is already final");
  await release(db, reserved, session);
  const key = await event(
    db,
    req.actor.id,
    request.id,
    "cancelled",
    input.reason,
    request.status,
    "cancelled",
  );
  const result = await save(db, "assistance", {
    ...request,
    status: "cancelled",
    reason: input.reason,
    updatedAt: now(),
  });
  await notify(
    db,
    request.customerId,
    key,
    "assistance",
    request.id,
    "Assistance cancelled",
    input.reason,
  );
  return requestDetail(db, result);
}
