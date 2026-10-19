import type { DB } from "../config/database.js";
import { advisoryLock } from "./locks.repository.js";

export async function priorOperation(
  db: DB,
  actorId: string,
  scope: string,
  key: string,
) {
  await advisoryLock(db, `${actorId}:${scope}:${key}`);
  return db.operation.findUnique({
    where: { actorId_scope_key: { actorId, scope, key } },
  });
}
export const beginOperation = (
  db: DB,
  actorId: string,
  scope: string,
  key: string,
  fingerprint: string,
) => db.operation.create({ data: { actorId, scope, key, fingerprint } });
export const finishOperation = (
  db: DB,
  actorId: string,
  scope: string,
  key: string,
  result: unknown,
) =>
  db.operation.update({
    where: { actorId_scope_key: { actorId, scope, key } },
    data: { response: JSON.parse(JSON.stringify(result)) },
  });
