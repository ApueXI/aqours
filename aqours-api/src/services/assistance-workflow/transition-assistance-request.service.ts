import type { DB } from "../../config/database.js";
import {
  event,
  notify,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import {
  lockRequest,
  release,
  requestDetail,
  reserve,
} from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { staffOwner } from "../../validators/common.js";

export async function transitionAssistanceRequest(db: DB, req: CommandContext) {
  const input = req.body;
  const { request, session, reserved } = await lockRequest(
    db,
    String(req.params.id),
  );
  version(request, input.expectedVersion);
  const next: Record<string, string[]> = {
    requested: ["accepted", "cancelled", "unavailable"],
    accepted: ["scheduled", "in_progress", "cancelled", "unavailable"],
    scheduled: ["scheduled", "in_progress", "cancelled", "unavailable"],
    in_progress: ["scheduled", "completed", "unavailable"],
  };
  if (!next[request.status]?.includes(input.status))
    fail(409, "Invalid assistance transition");
  if (
    ["cancelled", "unavailable"].includes(input.status) ||
    (input.status === "in_progress" && request.status === "accepted") ||
    (input.status === "scheduled" &&
      ["scheduled", "in_progress"].includes(request.status))
  ) {
    if (!input.reason) fail(400, "This transition requires a reason");
  }
  if (input.status === "scheduled" && !input.appointmentAt)
    fail(400, "Agreed appointment is required");
  if (input.status === "completed" && (!input.outcome || !input.nextSteps))
    fail(400, "Completion requires outcome and next steps");
  if (input.status === "completed" && request.type === "water_support")
    fail(409, "Record water collection through the allocation endpoint");
  if (input.status === "cancelled" && request.startedAt)
    fail(
      409,
      "Work has already begun; use staff review and unavailable outcome",
    );
  if (
    input.status === "scheduled" &&
    session &&
    input.appointmentAt &&
    (input.appointmentAt < session.startsAt ||
      input.appointmentAt > session.endsAt)
  )
    fail(
      400,
      "Pickup appointment must fall within the session operating interval",
    );
  const ownerId = input.ownerId ?? request.ownerId;
  await staffOwner(
    db,
    ownerId,
    ["accepted", "scheduled", "in_progress", "completed"].includes(
      input.status,
    ),
  );
  if (input.status === "accepted" && request.type === "water_support") {
    if (!session)
      fail(409, "No pickup session selected; provide support follow-up");
    await reserve(db, request, session);
  }
  if (["cancelled", "unavailable"].includes(input.status))
    await release(db, reserved, session);
  const key = await event(
    db,
    req.actor.id,
    request.id,
    input.status,
    input.reason ?? input.outcome ?? `Assistance ${input.status}`,
    request.status,
    input.status,
    false,
    {
      oldOwnerId: request.ownerId,
      newOwnerId: ownerId,
      oldAppointmentAt: request.appointmentAt,
      newAppointmentAt: input.appointmentAt ?? request.appointmentAt,
    },
  );
  const { expectedVersion: _e, ...patch } = input;
  const result = await save(db, "assistance", {
    ...request,
    ...patch,
    ownerId,
    startedAt:
      request.startedAt ?? (input.status === "in_progress" ? now() : null),
    updatedAt: now(),
  });
  await notify(
    db,
    request.customerId,
    key,
    "assistance",
    request.id,
    `Assistance ${input.status}`,
    `${input.reason ?? input.outcome ?? "Supplier updated your request."}${input.appointmentAt ? ` Appointment: ${input.appointmentAt}` : ""}${input.nextSteps ? ` Next steps: ${input.nextSteps}` : ""}`,
  );
  return requestDetail(db, result, true);
}
