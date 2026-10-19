import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, now, save, timeline, version, type Doc } from '../store.js';
import {
  category,
  expected,
  geometry,
  id,
  instant,
  staffOwner,
  text,
  zones,
} from '../validation.js';
import { published, reportSafe, updateSafe } from '../services/reports.js';
import { fail } from '../errors.js';
import { incidentPublicationRoutes } from './incident-publication.js';
const content = {
  category,
  summary: text,
  zoneIds: z.array(id).min(1).max(100),
  area: text,
  ownerId: id.nullable().optional(),
  geometry: geometry.nullable().optional(),
  restorationAt: instant.nullable().optional(),
  estimatedAffected: z.number().int().nonnegative().nullable().optional(),
  estimateBasis: text.nullable().optional(),
  demo: z.boolean().optional(),
};
async function detail(db: Parameters<typeof get>[0], doc: Doc, full = false) {
  const reports = (await all(db, 'report')).filter((v) => v.incidentId === doc.id);
  const updates = (await all(db, 'incident_update'))
    .filter((v) => v.incidentId === doc.id)
    .map(updateSafe);
  return {
    ...doc,
    updates,
    reportCount: reports.length,
    uniqueConnections: new Set(reports.map((v) => v.connectionId)).size,
    ...(full
      ? {
          reports: reports.map(reportSafe),
          notes: (await timeline(db, doc.id, true)).map((v) => ({ ...v, authorId: v.actorId })),
          timeline: await timeline(db, doc.id),
        }
      : {}),
  };
}
export function incidentRoutes(app: Express) {
  route(app, 'get', '/incidents', 'any', async (db, req) =>
    page(
      req,
      (await Promise.all((await all(db, 'incident')).map((doc) => published(db, doc)))).filter(
        Boolean,
      ),
    ),
  );
  route(app, 'get', '/incidents/:id', 'any', async (db, req) => {
    const result = await published(db, await get(db, 'incident', String(req.params.id)));
    if (!result) fail(404, 'Published incident not found');
    return result;
  });
  route(app, 'get', '/staff/incidents', 'staff', async (db, req) =>
    page(req, await Promise.all((await all(db, 'incident')).map((v) => detail(db, v)))),
  );
  route(app, 'get', '/staff/incidents/:id', 'staff', async (db, req) =>
    detail(db, await get(db, 'incident', String(req.params.id)), true),
  );
  route(app, 'post', '/staff/incidents', 'staff', async (db, req) => {
    const input = z.object(content).strict().parse(req.body);
    await zones(db, input.zoneIds);
    await staffOwner(db, input.ownerId);
    if (input.estimatedAffected != null && !input.estimateBasis)
      fail(400, 'Affected estimate requires its basis');
    const result = await create(db, 'incident', {
      ...input,
      status: 'investigating',
      ownerId: input.ownerId ?? null,
      geometry: input.geometry ?? null,
      restorationAt: input.restorationAt ?? null,
      estimatedAffected: input.estimatedAffected ?? null,
      estimateBasis: input.estimateBasis ?? null,
      estimateUpdatedAt: input.estimatedAffected != null ? now() : null,
      demo: input.demo ?? false,
      createdAt: now(),
    });
    await event(
      db,
      req.actor.id,
      result.id,
      'created',
      'Incident created',
      undefined,
      'investigating',
    );
    return detail(db, result);
  });
  route(app, 'patch', '/staff/incidents/:id', 'staff', async (db, req) => {
    const { category: _c, demo: _d, ...editable } = content;
    const input = z
      .object(editable)
      .partial()
      .extend({
        expectedVersion: expected,
        reason: text,
        status: z
          .enum(['investigating', 'confirmed', 'work_in_progress', 'monitoring', 'resolved'])
          .optional(),
      })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'incident', String(req.params.id), true);
    version(doc, input.expectedVersion);
    if (input.zoneIds) await zones(db, input.zoneIds);
    await staffOwner(db, input.ownerId);
    if (input.status && input.status !== doc.status) {
      const transitions: Record<string, string> = {
        investigating: 'confirmed',
        confirmed: 'work_in_progress',
        work_in_progress: 'monitoring',
        monitoring: 'resolved',
      };
      if (input.status !== 'investigating' && transitions[doc.status] !== input.status)
        fail(409, 'Invalid incident transition');
    }
    const { expectedVersion: _e, reason: _r, ...patch } = input;
    if (patch.estimatedAffected != null && !(patch.estimateBasis ?? doc.estimateBasis))
      fail(400, 'Affected estimate requires its basis');
    if (patch.estimatedAffected !== undefined) doc.estimateUpdatedAt = now();
    await event(
      db,
      req.actor.id,
      doc.id,
      'reviewed',
      input.reason,
      doc.status,
      input.status ?? doc.status,
      false,
      { changes: patch },
    );
    return detail(db, await save(db, 'incident', { ...doc, ...patch }));
  });
  incidentPublicationRoutes(app);
}
