import type { Express } from 'express';
import { z } from 'zod';
import { route, page, filter } from '../http.js';
import { all, create, event, get, notify, now, own, save, version } from '../store.js';
import { category, expected, id, instant, text } from '../validation.js';
import { reportCreate, reportDetail, reportSafe, published } from '../services/reports.js';
import { geocode } from '../services/geocode.js';
import { fail } from '../errors.js';
import { messageSafe } from '../services/projection.js';
import { reportReviewRoutes } from './report-review.js';
const location = z
  .object({
    address: text,
    source: z.enum(['saved_address', 'geocoded_address', 'gps']),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    confirmed: z.boolean(),
    accuracy: z.number().nonnegative().nullable().optional(),
    candidateToken: z.string().max(3000).optional(),
  })
  .strict();
export function reportRoutes(app: Express) {
  route(
    app,
    'post',
    '/locations/geocode',
    'customer',
    async (_db, req) => geocode(z.object({ address: text }).strict().parse(req.body).address),
    false,
  );
  route(app, 'post', '/reports', 'customer', async (db, req) => {
    const input = z
      .object({
        connectionId: id,
        category,
        description: text,
        noticedAt: instant,
        location: location.optional(),
        answers: z.object({ details: z.string().trim().max(2000).optional() }).strict().optional(),
      })
      .strict()
      .parse(req.body);
    if (new Date(input.noticedAt).getTime() > Date.now() + 60000)
      fail(400, 'Noticed time cannot be in the future');
    const result = await reportCreate(db, req.actor, input);
    await event(db, req.actor.id, result.id, 'submitted', 'Report received', undefined, 'received');
    return reportSafe(result);
  });
  for (const staff of [false, true]) {
    const prefix = staff ? '/staff/reports' : '/reports',
      access = staff ? 'staff' : 'customer';
    route(app, 'get', prefix, access, async (db, req) =>
      page(
        req,
        filter(req, await all(db, 'report', staff ? undefined : req.actor.id)).map(reportSafe),
      ),
    );
    route(app, 'get', prefix + '/:id', access, async (db, req) => {
      const doc = await get(db, 'report', String(req.params.id));
      if (!staff) own(doc, req.actor);
      return reportDetail(db, doc, staff);
    });
    route(app, 'post', prefix + '/:id/messages', access, async (db, req) => {
      const input = z.object({ text }).strict().parse(req.body),
        doc = await get(db, 'report', String(req.params.id), true);
      if (!staff) own(doc, req.actor);
      const message = await create(
        db,
        'message',
        {
          reportId: doc.id,
          text: input.text,
          authorId: req.actor.id,
          authorRole: req.actor.role,
          createdAt: now(),
        },
        doc.customerId,
        doc.id,
      );
      await event(db, req.actor.id, doc.id, 'message', input.text);
      if (staff) {
        if (!doc.firstRespondedAt) {
          doc.firstRespondedAt = now();
          await save(db, 'report', doc);
        }
        await notify(
          db,
          doc.customerId,
          message.id,
          'report',
          doc.id,
          'Supplier response',
          input.text,
        );
      }
      return messageSafe(message);
    });
  }
  route(app, 'post', '/reports/:id/still-affected', 'customer', async (db, req) => {
    const input = z.object({ expectedVersion: expected, reason: text }).strict().parse(req.body),
      doc = await get(db, 'report', String(req.params.id), true);
    own(doc, req.actor);
    version(doc, input.expectedVersion);
    if (doc.status !== 'resolved') fail(409, 'Only resolved reports can return to review');
    await event(
      db,
      req.actor.id,
      doc.id,
      'still_affected',
      input.reason,
      doc.status,
      'under_review',
    );
    return reportSafe(
      await save(db, 'report', {
        ...doc,
        status: 'under_review',
        closureOutcome: null,
        closureReason: null,
      }),
    );
  });
  route(app, 'post', '/incidents/:id/affected', 'customer', async (db, req) => {
    const input = z.object({ connectionId: id }).strict().parse(req.body),
      incident = await get(db, 'incident', String(req.params.id));
    if (!(await published(db, incident))) fail(404, 'Published incident not found');
    await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
      `affected:${req.actor.id}:${input.connectionId}:${incident.id}`,
    ]);
    const existing = (await all(db, 'report', req.actor.id)).find(
      (v) => v.assertedIncidentId === incident.id && v.connectionId === input.connectionId,
    );
    if (existing) return reportSafe(existing);
    const doc = await reportCreate(
      db,
      req.actor,
      {
        ...input,
        category: incident.category,
        description: 'Customer marked affected by published incident',
        noticedAt: now(),
      },
      incident.id,
    );
    await event(
      db,
      req.actor.id,
      doc.id,
      'affected',
      'Customer marked affected',
      undefined,
      'received',
    );
    return reportSafe(doc);
  });
  reportReviewRoutes(app);
}
