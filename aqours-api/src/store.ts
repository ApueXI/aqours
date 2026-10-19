import { randomUUID } from 'node:crypto';
import type { DB } from './db.js';
import { fail } from './errors.js';
export type Doc = Record<string, any> & { id: string; version: number };
export async function get(db: DB, kind: string, id: string, lock = false): Promise<Doc> {
  const { rows } = await db.query(
    'SELECT id,version,data FROM records WHERE kind=$1 AND id=$2' + (lock ? ' FOR UPDATE' : ''),
    [kind, id],
  );
  if (!rows[0]) fail(404, 'Record not found', 'not_found');
  return { ...rows[0].data, id: rows[0].id, version: rows[0].version };
}
export async function all(db: DB, kind: string, owner?: string): Promise<Doc[]> {
  const { rows } = await db.query(
    'SELECT id,version,data FROM records WHERE kind=$1' +
      (owner ? ' AND owner_id=$2' : '') +
      ' ORDER BY created_at DESC,id',
    owner ? [kind, owner] : [kind],
  );
  return rows.map((row) => ({ ...row.data, id: row.id, version: row.version }));
}
export async function create(
  db: DB,
  kind: string,
  data: Record<string, any>,
  owner: string | null = null,
  parent: string | null = null,
  id: string = randomUUID(),
): Promise<Doc> {
  const revision = data.version ?? 1;
  await db.query(
    'INSERT INTO records(id,kind,owner_id,parent_id,data,version) VALUES($1,$2,$3,$4,$5,$6)',
    [id, kind, owner, parent, data, revision],
  );
  return { ...data, id, version: revision };
}
export async function save(db: DB, kind: string, doc: Doc): Promise<Doc> {
  const { id, version, ...data } = doc;
  const { rows } = await db.query(
    'UPDATE records SET data=$3,version=version+1,updated_at=now() WHERE id=$1 AND kind=$2 AND version=$4 RETURNING version',
    [id, kind, data, version],
  );
  if (!rows[0]) fail(409, 'Record changed; refresh and retry', 'stale_version');
  return { ...data, id, version: rows[0].version };
}
export function version(doc: Doc, expected: unknown) {
  if (!Number.isInteger(expected) || Number(expected) < 1) fail(400, 'expectedVersion is required');
  if (doc.version !== expected) fail(409, 'Record changed; refresh and retry', 'stale_version');
}
export function own(doc: Doc, actor: Doc) {
  if (doc.customerId !== actor.id) fail(404, 'Record not found', 'not_found');
}
export async function event(
  db: DB,
  actor: string,
  target: string,
  action: string,
  text: string,
  from?: string,
  to?: string,
  isPrivate = false,
  metadata = {},
) {
  const id = randomUUID();
  await db.query(
    'INSERT INTO events(id,target_id,actor_id,action,text,from_status,to_status,private,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [id, target, actor, action, text, from, to, isPrivate, metadata],
  );
  return id;
}
export async function timeline(db: DB, id: string, isPrivate = false) {
  const { rows } = await db.query(
    'SELECT id,action,text,actor_id AS "actorId",from_status AS "fromStatus",to_status AS "toStatus",created_at AS "createdAt",metadata FROM events WHERE target_id=$1 AND private=$2 ORDER BY created_at,id',
    [id, isPrivate],
  );
  return rows.map(({ metadata, ...item }) => {
    const from = metadata?.oldAppointmentAt;
    const to = metadata?.newAppointmentAt;
    const validTime = (value: unknown): value is string =>
      typeof value === 'string' && Number.isFinite(Date.parse(value));
    if (item.action === 'scheduled' && validTime(to)) {
      return { ...item, appointmentChange: { from: validTime(from) ? from : null, to } };
    }
    return item;
  });
}
export async function notify(
  db: DB,
  user: string,
  key: string,
  targetType: string,
  targetId: string,
  title: string,
  text: string,
) {
  await db.query(
    'INSERT INTO notifications(id,user_id,source_event_key,data) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,source_event_key) DO NOTHING',
    [randomUUID(), user, key, { title, text, targetType, targetId, sourceEventKey: key }],
  );
}
export const now = () => new Date().toISOString();
export const reference = (prefix: string) => `${prefix}-${randomUUID().slice(0, 12).toUpperCase()}`;
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
