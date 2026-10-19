import type { DB } from '../db.js';
import { fail } from '../errors.js';
import { all, get, reference, save, type Doc } from '../store.js';
import { randomUUID } from 'node:crypto';
import { project, assistanceFields, siteSafe, sessionSafe } from './projection.js';
export async function stock(db: DB, sessionId: string) {
  const { rows } = await db.query(
    `SELECT s.total::text AS "totalLiters",
    COALESCE(sum(a.liters) FILTER(WHERE a.state='reserved'),0)::numeric(14,2)::text AS "reservedLiters",
    COALESCE(sum(a.liters) FILTER(WHERE a.state='collected'),0)::numeric(14,2)::text AS "collectedLiters",
    (s.total-COALESCE(sum(a.liters) FILTER(WHERE a.state IN ('reserved','collected')),0))::numeric(14,2)::text AS "remainingLiters"
    FROM stock_sessions s LEFT JOIN allocations a ON a.session_id=s.id WHERE s.id=$1 GROUP BY s.id`,
    [sessionId],
  );
  if (!rows[0]) fail(404, 'Pickup session not found');
  return rows[0];
}
export async function sessionDetail(db: DB, doc: Doc) {
  const site = await get(db, 'site', doc.siteId),
    amounts = await stock(db, doc.id);
  const availability =
    doc.status !== 'open' || !site.active || new Date(doc.endsAt).getTime() <= Date.now()
      ? 'unavailable'
      : Number(amounts.remainingLiters) <= 0
        ? 'full'
        : 'available';
  return { ...sessionSafe(doc), site: siteSafe(site), ...amounts, availability };
}
export async function allocation(db: DB, requestId: string, lock = false) {
  const { rows } = await db.query(
    `SELECT id,request_id AS "requestId",session_id AS "sessionId",liters::text,reference,state,
    reserved_at AS "reservedAt",collected_at AS "collectedAt",released_at AS "releasedAt" FROM allocations WHERE request_id=$1` +
      (lock ? ' FOR UPDATE' : ''),
    [requestId],
  );
  return rows[0] ?? null;
}
export async function lockSession(db: DB, id: string) {
  const session = await get(db, 'pickup_session', id, true);
  await db.query('SELECT id FROM stock_sessions WHERE id=$1 FOR UPDATE', [id]);
  return session;
}
export async function lockRequest(db: DB, id: string) {
  const initial = await get(db, 'assistance', id);
  const session =
    initial.type === 'water_support' && initial.details.sessionId
      ? await lockSession(db, initial.details.sessionId)
      : null;
  const request = await get(db, 'assistance', id, true);
  const reserved = await allocation(db, id, true);
  return { request, session, reserved };
}
export async function requestDetail(db: DB, doc: Doc, staff = false, full = true) {
  const reserved = await allocation(db, doc.id);
  const sessionId = reserved?.sessionId ?? doc.details.sessionId;
  const session = sessionId
    ? await sessionDetail(db, await get(db, 'pickup_session', sessionId))
    : null;
  const { timeline } = await import('../store.js');
  return {
    ...project(doc, assistanceFields),
    allocation: reserved,
    session,
    canCancel: !doc.startedAt && ['requested', 'accepted', 'scheduled'].includes(doc.status),
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
  if (current.availability !== 'available')
    fail(409, 'Pickup session is unavailable or full', 'stock');
  const report = await get(db, 'report', request.reportId);
  if (!report.zoneConfirmed || !session.zoneIds.includes(report.zoneId))
    fail(409, 'Confirmed report zone is not eligible for this pickup session');
  const { rows } = await db.query(
    `SELECT (s.total-COALESCE((SELECT sum(liters) FROM allocations WHERE session_id=s.id AND state IN ('reserved','collected')),0)) >= $2::numeric AS enough FROM stock_sessions s WHERE s.id=$1`,
    [session.id, request.details.requestedLiters],
  );
  if (!rows[0]?.enough) fail(409, 'Insufficient remaining liters', 'stock');
  await db.query(
    "INSERT INTO allocations(id,request_id,session_id,liters,reference,state) VALUES($1,$2,$3,$4,$5,'reserved')",
    [randomUUID(), request.id, session.id, request.details.requestedLiters, reference('PICKUP')],
  );
  await save(db, 'pickup_session', { ...session, updatedAt: new Date().toISOString() });
}
export async function release(db: DB, reserved: any, session: Doc | null) {
  if (reserved?.state === 'reserved') {
    await db.query(
      "UPDATE allocations SET state='released',released_at=now() WHERE id=$1 AND state='reserved'",
      [reserved.id],
    );
    if (session)
      await save(db, 'pickup_session', { ...session, updatedAt: new Date().toISOString() });
  }
}
export async function eligibleSessions(db: DB, customerId: string, report?: Doc) {
  const connections = report
    ? [report].filter((v) => v.zoneConfirmed)
    : (await all(db, 'connection', customerId)).filter((v) => v.zoneConfirmed);
  const sessions = (await all(db, 'pickup_session')).filter((v) =>
    connections.some((c) => v.zoneIds.includes(c.zoneId)),
  );
  return Promise.all(sessions.map((v) => sessionDetail(db, v)));
}
