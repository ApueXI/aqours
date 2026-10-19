import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { create, event, get, now, own } from '../store.js';
import { evaluate } from '../services/guidance.js';
import { context } from '../services/guidance-context.js';
import { guidanceSafe } from '../services/projection.js';
import { instant } from '../validation.js';
import { fail } from '../errors.js';
const answers = z
  .object({
    needsWater: z.boolean().optional(),
    hazard: z.boolean().optional(),
    persistent: z.boolean().optional(),
    nearbyAffected: z.enum(['yes', 'no', 'unknown']).optional(),
    waterNeededBy: instant.optional(),
  })
  .strict();
export function guidanceRoutes(app: Express) {
  route(
    app,
    'post',
    '/reports/:id/guidance',
    'customer',
    async (db, req) => {
      const input = z.object({ answers: answers.optional() }).strict().parse(req.body);
      const report = await get(db, 'report', String(req.params.id));
      own(report, req.actor);
      const result = await evaluate(db, report, input.answers ?? report.answers ?? {});
      const doc = await create(
        db,
        'guidance',
        { ...result, customerId: req.actor.id, answers: input.answers ?? report.answers ?? {} },
        req.actor.id,
        report.id,
      );
      return guidanceSafe(doc);
    },
    false,
  );
  route(app, 'get', '/guidance/:id', 'customer', async (db, req) => {
    const doc = await get(db, 'guidance', String(req.params.id));
    own(doc, req.actor);
    const ctx = await context(db, await get(db, 'report', doc.reportId));
    return { ...guidanceSafe(doc), current: doc.sourceSignature === ctx.signature };
  });
  route(app, 'post', '/guidance/:id/choice', 'customer', async (db, req) => {
    const input = z
      .object({ action: z.enum(['callback', 'inspection', 'water_support', 'decline']) })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'guidance', String(req.params.id));
    own(doc, req.actor);
    const choice = await create(
      db,
      'guidance_choice',
      { guidanceId: doc.id, action: input.action, createdAt: now(), customerId: req.actor.id },
      req.actor.id,
      doc.id,
    );
    await event(
      db,
      req.actor.id,
      doc.id,
      'choice',
      `Customer chose ${input.action}; no assistance request submitted`,
    );
    return { id: choice.id, action: choice.action, createdAt: choice.createdAt };
  });
  route(app, 'get', '/notifications', 'customer', async (db, req) => {
    const { rows } = await db.query(
      'SELECT id,data,created_at,read_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC,id',
      [req.actor.id],
    );
    return page(
      req,
      rows.map((v) => ({ ...v.data, id: v.id, createdAt: v.created_at, readAt: v.read_at })),
    );
  });
  route(app, 'get', '/notifications/:id', 'customer', async (db, req) => {
    const { rows } = await db.query(
      'SELECT id,data,created_at,read_at FROM notifications WHERE user_id=$1 AND id=$2',
      [req.actor.id, req.params.id],
    );
    if (!rows[0]) fail(404, 'Notification not found');
    const v = rows[0];
    return { ...v.data, id: v.id, createdAt: v.created_at, readAt: v.read_at };
  });
  route(
    app,
    'patch',
    '/notifications/:id/read',
    'customer',
    async (db, req) => {
      z.object({}).strict().parse(req.body);
      const { rows } = await db.query(
        'UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE user_id=$1 AND id=$2 RETURNING id,data,created_at,read_at',
        [req.actor.id, req.params.id],
      );
      if (!rows[0]) fail(404, 'Notification not found');
      const v = rows[0];
      return { ...v.data, id: v.id, createdAt: v.created_at, readAt: v.read_at };
    },
    false,
  );
}
