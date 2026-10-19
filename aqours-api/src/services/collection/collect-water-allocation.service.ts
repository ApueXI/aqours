import type { DB } from "../../config/database.js";
import {
  event,
  notify,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import {
  allocationRequest,
  collectAllocation,
} from "../../repositories/stock.repository.js";
import { lockRequest, requestDetail } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function collectWaterAllocation(db: DB, req: CommandContext) {
  const input = req.body;
  const row = await allocationRequest(db, String(req.params.id));
  if (!row) fail(404, "Allocation not found");
  const { request, session, reserved } = await lockRequest(db, row.requestId);
  version(request, input.expectedVersion);
  if (!session || session.status !== "open" || reserved?.state !== "reserved")
    fail(409, "Allocation is no longer collectible");
  if (
    !["scheduled", "in_progress"].includes(request.status) &&
    !(request.status === "accepted" && input.reason)
  )
    fail(409, "Schedule collection or record immediate support reason");
  await collectAllocation(db, reserved.id);
  await save(db, "pickup_session", { ...session, updatedAt: now() });
  const key = await event(
    db,
    req.actor.id,
    request.id,
    "collected",
    input.outcome,
    request.status,
    "completed",
  );
  const result = await save(db, "assistance", {
    ...request,
    status: "completed",
    reason: input.reason ?? null,
    outcome: input.outcome,
    nextSteps: input.nextSteps,
    updatedAt: now(),
  });
  await notify(
    db,
    request.customerId,
    key,
    "assistance",
    request.id,
    "Water collected",
    `${input.outcome} ${input.nextSteps}`,
  );
  return requestDetail(db, result, true);
}
