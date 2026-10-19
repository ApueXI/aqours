import type { DB } from "../../config/database.js";
import {
  all,
  create,
  get,
  notify,
  now,
  type Doc,
} from "../../repositories/domain.repository.js";
import { liveSession } from "../../repositories/security.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { zones } from "../../validators/common.js";
import { advisoryFields, project } from "../presentation/projection.js";
export const qualityKinds = ["boil_water", "do_not_drink", "do_not_use"];
export async function advisoryPublisher(db: DB, req: CommandContext) {
  const actor = await get(db, "user", req.actor.id, true);
  if (!actor.active || actor.role !== "admin")
    fail(403, "Active administrator required");
  if (!(await liveSession(db, req.session.hash, actor.id)))
    fail(401, "Session expired or revoked", "unauthenticated");
}
export async function advisoryTargets(db: DB, doc: Doc) {
  if (!doc.zoneIds.length && !doc.connectionIds.length)
    fail(400, "Advisory requires explicit targets");
  for (const connection of [...new Set<string>(doc.connectionIds)].sort())
    await get(db, "connection", connection, true);
  // Connection edits lock the connection before its zone; use the same order.
  if (doc.zoneIds.length) await zones(db, doc.zoneIds);
}
export function isCurrent(doc: Doc) {
  if (doc.state !== "published") return false;
  if (qualityKinds.includes(doc.kind)) return true;
  return (
    (!doc.startsAt || doc.startsAt <= now()) &&
    (!doc.endsAt || doc.endsAt > now())
  );
}
export function matches(advisory: Doc, connection: Doc) {
  return (
    advisory.connectionIds.includes(connection.id) ||
    (connection.zoneConfirmed && advisory.zoneIds.includes(connection.zoneId))
  );
}
export async function applicable(
  db: DB,
  customer: string,
  includeLifted = false,
) {
  const connections = await all(db, "connection", customer);
  return (await all(db, "advisory")).filter(
    (v) =>
      (includeLifted ? v.state !== "draft" : isCurrent(v)) &&
      connections.some((c) => matches(v, c)),
  );
}
export function advisorySafe(doc: Doc, ownedConnections: Doc[] = []) {
  const ownedIds = new Set(ownedConnections.map((connection) => connection.id));
  return {
    ...project(doc, advisoryFields),
    connectionIds: doc.connectionIds.filter((id: string) => ownedIds.has(id)),
  };
}
export async function advisoryFanout(db: DB, doc: Doc, action: string) {
  const connections = await all(db, "connection");
  const recipients = new Set(
    connections.filter((c) => matches(doc, c)).map((c) => c.customerId),
  );
  for (const recipient of recipients)
    await notify(
      db,
      recipient,
      `${doc.id}:${doc.version}:${action}`,
      "advisory",
      doc.id,
      `${doc.demo ? "Demo: " : ""}${doc.title}`,
      action === "lifted" ? `Notice lifted: ${doc.liftReason}` : doc.text,
    );
}
export async function advisoryRevision(db: DB, doc: Doc, action: string) {
  await create(
    db,
    "advisory_revision",
    {
      advisoryId: doc.id,
      snapshot: doc,
      action,
      createdAt: now(),
      version: doc.version,
    },
    null,
    doc.id,
  );
}
