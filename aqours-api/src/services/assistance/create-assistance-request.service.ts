import type { DB } from "../../config/database.js";
import {
  create,
  event,
  get,
  now,
  own,
  reference,
} from "../../repositories/domain.repository.js";
import { lockSession, requestDetail } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function createAssistanceRequest(db: DB, req: CommandContext) {
  const input = req.body;
  const report = await get(db, "report", input.reportId);
  own(report, req.actor);
  if (
    input.type === "callback" &&
    (!input.details.question ||
      !input.details.contactNumber ||
      !input.details.preferredWindow)
  )
    fail(
      400,
      "Callback requires question, contact number and preferred window",
    );
  if (
    input.type === "inspection" &&
    (!input.details.issueDetails ||
      !input.details.siteAddress ||
      !input.details.preferredWindow ||
      !input.details.accessInstructions)
  )
    fail(
      400,
      "Inspection requires issue, address, preferred window and access instructions",
    );
  if (input.type === "water_support") {
    if (!input.details.requestedLiters)
      fail(400, "Requested liters are required");
    if (input.details.sessionId) {
      const session = await lockSession(db, input.details.sessionId);
      if (!report.zoneConfirmed || !session.zoneIds.includes(report.zoneId))
        fail(
          400,
          "Selected pickup session does not serve the confirmed issue zone",
        );
      if (
        session.status !== "open" ||
        new Date(session.endsAt).getTime() <= Date.now()
      )
        fail(409, "Pickup session is unavailable");
    }
  } else if (input.details.sessionId || input.details.requestedLiters)
    fail(400, "Water fields require water support");
  const result = await create(
    db,
    "assistance",
    {
      ...input,
      customerId: req.actor.id,
      incidentId: report.incidentId,
      reference: reference("HELP"),
      status: "requested",
      ownerId: null,
      appointmentAt: null,
      outcome: null,
      nextSteps: null,
      reason: null,
      createdAt: now(),
      updatedAt: now(),
    },
    req.actor.id,
    report.id,
  );
  await event(
    db,
    req.actor.id,
    result.id,
    "requested",
    "Request submitted; acceptance and appointments are not guaranteed",
    undefined,
    "requested",
  );
  return requestDetail(db, result);
}
