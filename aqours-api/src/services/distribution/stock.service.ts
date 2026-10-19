import type { DB } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import {
  all,
  get,
  reference,
  save,
  type Doc,
} from "../../repositories/domain.repository.js";
import { lockStock } from "../../repositories/locks.repository.js";
import {
  getAllocation,
  insertAllocation,
  releaseAllocation,
  stockAmounts,
} from "../../repositories/stock.repository.js";
import { fail } from "../../utils/errors.js";
import {
  assistanceFields,
  project,
  sessionSafe,
  siteSafe,
} from "../presentation/projection.js";
export const stock = stockAmounts;
export async function sessionDetail(
  db: DB,
  doc: Doc,
): Promise<Record<string, any>> {
  const site = await get(db, "site", doc.siteId),
    amounts = await stock(db, doc.id);
  const availability =
    doc.status !== "open" ||
    !site.active ||
    new Date(doc.endsAt).getTime() <= Date.now()
      ? "unavailable"
      : Number(amounts.remainingLiters) <= 0
        ? "full"
        : "available";
  return {
    ...sessionSafe(doc),
    site: siteSafe(site),
    ...amounts,
    availability,
  };
}
export const allocation = getAllocation;
export async function lockSession(db: DB, id: string) {
  const session = await get(db, "pickup_session", id, true);
  await lockStock(db, id);
  return session;
}
export async function lockRequest(db: DB, id: string) {
  const initial = await get(db, "assistance", id);
  const session =
    initial.type === "water_support" && initial.details.sessionId
      ? await lockSession(db, initial.details.sessionId)
      : null;
  const request = await get(db, "assistance", id, true);
  const reserved = await allocation(db, id, true);
  return { request, session, reserved };
}
export async function requestDetail(
  db: DB,
  doc: Doc,
  staff = false,
  full = true,
) {
  const reserved = await allocation(db, doc.id);
  const sessionId = reserved?.sessionId ?? doc.details.sessionId;
  const session = sessionId
    ? await sessionDetail(db, await get(db, "pickup_session", sessionId))
    : null;
  const { timeline } = await import("../../repositories/domain.repository.js");
  return {
    ...project(doc, assistanceFields),
    allocation: reserved,
    session,
    canCancel:
      !doc.startedAt &&
      ["requested", "accepted", "scheduled"].includes(doc.status),
    ...(full
      ? {
          timeline: await timeline(db, doc.id),
          ...(staff
            ? {
                notes: (await timeline(db, doc.id, true)).map((v) => ({
                  ...v,
                  authorId: v.actorId,
                })),
              }
            : {}),
        }
      : {}),
  };
}
export async function reserve(db: DB, request: Doc, session: Doc) {
  const current = await sessionDetail(db, session);
  if (current.availability !== "available")
    fail(409, "Pickup session is unavailable or full", "stock");
  const report = await get(db, "report", request.reportId);
  if (!report.zoneConfirmed || !session.zoneIds.includes(report.zoneId))
    fail(409, "Confirmed report zone is not eligible for this pickup session");
  const amount = await stockAmounts(db, session.id);
  if (
    new Prisma.Decimal(amount.remainingLiters).lessThan(
      request.details.requestedLiters,
    )
  )
    fail(409, "Insufficient remaining liters", "stock");
  await insertAllocation(
    db,
    request.id,
    session.id,
    request.details.requestedLiters,
    reference("PICKUP"),
  );
  await save(db, "pickup_session", {
    ...session,
    updatedAt: new Date().toISOString(),
  });
}
export async function release(db: DB, reserved: any, session: Doc | null) {
  if (reserved?.state === "reserved") {
    await releaseAllocation(db, reserved.id);
    if (session)
      await save(db, "pickup_session", {
        ...session,
        updatedAt: new Date().toISOString(),
      });
  }
}
export async function eligibleSessions(
  db: DB,
  customerId: string,
  report?: Doc,
) {
  const connections = report
    ? [report].filter((v) => v.zoneConfirmed)
    : (await all(db, "connection", customerId)).filter((v) => v.zoneConfirmed);
  const sessions = (await all(db, "pickup_session")).filter((v) =>
    connections.some((c) => v.zoneIds.includes(c.zoneId)),
  );
  return Promise.all(sessions.map((v) => sessionDetail(db, v)));
}
