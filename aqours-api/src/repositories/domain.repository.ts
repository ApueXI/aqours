import { randomUUID } from "node:crypto";
import type { DB } from "../config/database.js";
import type { Doc } from "../types/domain.js";
import { fail } from "../utils/errors.js";
import { repository } from "./registry.js";
export type { Doc } from "../types/domain.js";
export { event, notify, timeline } from "./history.repository.js";
export const get = (db: DB, kind: string, id: string, lock = false) =>
  repository(db, kind).get(id, lock);
export const all = (db: DB, kind: string, owner?: string) =>
  repository(db, kind).all(owner);
export async function create(
  db: DB,
  kind: string,
  data: Record<string, any>,
  _owner: string | null = null,
  _parent: string | null = null,
  id: string = randomUUID(),
) {
  return repository(db, kind).create(id, data);
}
export const save = (db: DB, kind: string, doc: Doc) =>
  repository(db, kind).save(doc);
export function version(doc: Doc, expected: unknown) {
  if (!Number.isInteger(expected) || Number(expected) < 1)
    fail(400, "expectedVersion is required");
  if (doc.version !== expected)
    fail(409, "Record changed; refresh and retry", "stale_version");
}
export function own(doc: Doc, actor: Doc) {
  if (doc.customerId !== actor.id) fail(404, "Record not found", "not_found");
}
export const now = () => new Date().toISOString();
export const reference = (prefix: string) =>
  `${prefix}-${randomUUID().slice(0, 12).toUpperCase()}`;
export function userSafe(doc: Doc) {
  return {
    id: doc.id,
    version: doc.version,
    email: doc.email,
    name: doc.name,
    phone: doc.phone,
    active: doc.active,
    role: doc.role,
  };
}
