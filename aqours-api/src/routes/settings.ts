import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, now, save, version } from '../store.js';
import { expected, geometry, kind, short, text } from '../validation.js';
import { fail } from '../errors.js';
import { accountSettingsRoutes } from './settings-accounts.js';
import { connectionSettingsRoutes } from './settings-connections.js';
const zoneFields = {
  name: short,
  boundary: geometry.nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function settingsRoutes(app: Express) {
  route(app, 'get', '/staff/settings/zones', 'admin', async (db) => all(db, 'zone'));
  route(app, 'post', '/staff/settings/zones', 'admin', async (db, req) => {
    const input = z
      .object({ code: short, ...zoneFields })
      .strict()
      .parse(req.body);
    const doc = await create(db, 'zone', {
      ...input,
      boundary: input.boundary ?? null,
      active: input.active ?? true,
      demo: input.demo ?? false,
    });
    await event(
      db,
      req.actor.id,
      doc.id,
      'zone_created',
      'Zone created',
      undefined,
      undefined,
      true,
    );
    return doc;
  });
  route(app, 'patch', '/staff/settings/zones/:id', 'admin', async (db, req) => {
    const { demo: _d, ...editable } = zoneFields;
    const input = z
      .object(editable)
      .partial()
      .extend({ expectedVersion: expected, reason: text })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'zone', String(req.params.id), true);
    version(doc, input.expectedVersion);
    if (input.active === false) {
      const connections = (await all(db, 'connection')).some((v) => v.zoneId === doc.id);
      const reports = (await all(db, 'report')).some(
        (v) => v.zoneId === doc.id && v.status !== 'resolved',
      );
      const incidents = (await all(db, 'incident')).some(
        (v) => v.zoneIds.includes(doc.id) && v.status !== 'resolved',
      );
      const advisories = (await all(db, 'advisory')).some(
        (v) => v.zoneIds.includes(doc.id) && v.state === 'published',
      );
      const sessions = (await all(db, 'pickup_session')).some(
        (v) => v.zoneIds.includes(doc.id) && v.status === 'open',
      );
      if (connections || reports || incidents || advisories || sessions)
        fail(409, 'Zone has active references');
    }
    const { expectedVersion: _e, reason: _r, ...fields } = input;
    await event(db, req.actor.id, doc.id, 'zone_updated', input.reason, undefined, undefined, true);
    return save(db, 'zone', { ...doc, ...fields });
  });
  for (const settings of ['guidance', 'rules'] as const) {
    const recordKind = settings === 'guidance' ? 'approved_guidance' : 'rule';
    route(app, 'get', '/staff/settings/' + settings, 'staff', async (db) => {
      const values = await all(db, recordKind),
        latest = Math.max(0, ...values.map((v) => v.version));
      return settings === 'rules'
        ? values.map((v) => ({ ...v, active: v.version === latest }))
        : values;
    });
    route(app, 'post', '/staff/settings/' + settings, 'admin', async (db, req) => {
      const input =
        settings === 'guidance'
          ? z.object({ kind, text, source: text }).strict().parse(req.body)
          : z
              .object({ contactText: text, inspectionText: text, waterText: text })
              .strict()
              .parse(req.body);
      await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [recordKind]);
      const previous = await all(db, recordKind),
        next = Math.max(0, ...previous.map((v) => v.version)) + 1;
      const doc = await create(db, recordKind, {
        ...input,
        version: next,
        ...(settings === 'rules' ? { active: true } : {}),
        createdAt: now(),
      });
      await event(
        db,
        req.actor.id,
        doc.id,
        `${recordKind}_published`,
        'New approved immutable configuration version',
        undefined,
        undefined,
        true,
      );
      return doc;
    });
  }
  route(app, 'get', '/staff/audit', 'staff', async (db, req) => {
    const { rows } = await db.query(
      'SELECT id,target_id AS "targetId",actor_id AS "actorId",action,text,from_status AS "fromStatus",to_status AS "toStatus",created_at AS "createdAt",metadata FROM events ORDER BY created_at DESC,id',
    );
    return page(req, rows);
  });
  accountSettingsRoutes(app);
  connectionSettingsRoutes(app);
}
