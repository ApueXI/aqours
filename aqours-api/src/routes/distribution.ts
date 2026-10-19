import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, notify, now, save, version } from '../store.js';
import { expected, id, instant, interval, text, totalLiters, zones } from '../validation.js';
import { allocation, lockSession, sessionDetail } from '../services/stock.js';
import { fail } from '../errors.js';
import { pickupSiteRoutes } from './pickup-sites.js';
import { collectionRoutes } from './collection.js';
const sessionFields = {
  siteId: id,
  zoneIds: z.array(id).min(1).max(100),
  startsAt: instant,
  endsAt: instant,
  totalLiters,
  instructions: text,
  demo: z.boolean().optional(),
};
export function distributionRoutes(app: Express) {
  route(app, 'get', '/staff/distribution/sessions', 'staff', async (db, req) =>
    page(
      req,
      await Promise.all((await all(db, 'pickup_session')).map((v) => sessionDetail(db, v))),
    ),
  );
  route(app, 'post', '/staff/distribution/sessions', 'staff', async (db, req) => {
    const input = z.object(sessionFields).strict().parse(req.body);
    interval(input.startsAt, input.endsAt);
    await zones(db, input.zoneIds);
    const site = await get(db, 'site', input.siteId);
    if (!site.active) fail(400, 'Pickup site is inactive');
    const { totalLiters: amount, ...fields } = input;
    const doc = await create(
      db,
      'pickup_session',
      { ...fields, status: 'open', demo: input.demo ?? false, updatedAt: now() },
      null,
      site.id,
    );
    await db.query('INSERT INTO stock_sessions(id,total) VALUES($1,$2)', [doc.id, amount]);
    await event(db, req.actor.id, doc.id, 'created', `Session created with ${amount} liters`);
    return sessionDetail(db, doc);
  });
  route(app, 'patch', '/staff/distribution/sessions/:id', 'staff', async (db, req) => {
    const { siteId: _s, demo: _d, ...editable } = sessionFields;
    const input = z
      .object(editable)
      .partial()
      .extend({
        expectedVersion: expected,
        reason: text,
        status: z.enum(['open', 'closed']).optional(),
      })
      .strict()
      .parse(req.body);
    const doc = await lockSession(db, String(req.params.id));
    version(doc, input.expectedVersion);
    if (doc.status === 'cancelled') fail(409, 'Cancelled sessions cannot reopen');
    if (input.zoneIds) {
      await zones(db, input.zoneIds);
      const requests = (await all(db, 'assistance')).filter(
        (v) =>
          v.details.sessionId === doc.id &&
          ['requested', 'accepted', 'scheduled', 'in_progress'].includes(v.status),
      );
      for (const request of requests) {
        const report = await get(db, 'report', request.reportId);
        if (!input.zoneIds.includes(report.zoneId))
          fail(409, 'Cannot remove zones serving active requests');
      }
    }
    interval(input.startsAt ?? doc.startsAt, input.endsAt ?? doc.endsAt);
    if (input.totalLiters !== undefined) {
      const { rowCount } = await db.query(
        "UPDATE stock_sessions SET total=$2 WHERE id=$1 AND $2::numeric >= COALESCE((SELECT sum(liters) FROM allocations WHERE session_id=$1 AND state IN ('reserved','collected')),0)",
        [doc.id, input.totalLiters],
      );
      if (!rowCount) fail(409, 'Stock cannot be lower than reservations and collections', 'stock');
    }
    const { expectedVersion: _e, reason: _r, totalLiters: _l, ...patch } = input;
    await event(db, req.actor.id, doc.id, 'reviewed', input.reason, undefined, undefined, false, {
      totalLiters: input.totalLiters,
    });
    return sessionDetail(
      db,
      await save(db, 'pickup_session', { ...doc, ...patch, updatedAt: now() }),
    );
  });
  route(app, 'post', '/staff/distribution/sessions/:id/cancel', 'staff', async (db, req) => {
    const input = z.object({ expectedVersion: expected, reason: text }).strict().parse(req.body);
    const doc = await lockSession(db, String(req.params.id));
    version(doc, input.expectedVersion);
    if (doc.status === 'cancelled') fail(409, 'Session is already cancelled');
    const candidates = (await all(db, 'assistance'))
      .filter((v) => v.type === 'water_support' && v.details.sessionId === doc.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const candidate of candidates) {
      const request = await get(db, 'assistance', candidate.id, true),
        reserved = await allocation(db, request.id, true);
      if (
        reserved?.state === 'collected' ||
        !['requested', 'accepted', 'scheduled', 'in_progress'].includes(request.status)
      )
        continue;
      if (reserved?.state === 'reserved')
        await db.query("UPDATE allocations SET state='released',released_at=now() WHERE id=$1", [
          reserved.id,
        ]);
      const key = await event(
        db,
        req.actor.id,
        request.id,
        'session_cancelled',
        input.reason,
        request.status,
        'unavailable',
      );
      await save(db, 'assistance', {
        ...request,
        status: 'unavailable',
        reason: input.reason,
        nextSteps: 'Contact supplier support for an alternative pickup arrangement.',
        updatedAt: now(),
      });
      await notify(
        db,
        request.customerId,
        key,
        'assistance',
        request.id,
        'Pickup session cancelled',
        `${input.reason} Contact supplier support for an alternative.`,
      );
    }
    await event(db, req.actor.id, doc.id, 'cancelled', input.reason, doc.status, 'cancelled');
    return sessionDetail(
      db,
      await save(db, 'pickup_session', { ...doc, status: 'cancelled', updatedAt: now() }),
    );
  });
  pickupSiteRoutes(app);
  collectionRoutes(app);
}
