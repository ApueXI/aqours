import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, now, save, version } from '../store.js';
import { expected, geometry, id, instant, kind, short, text, zones } from '../validation.js';
import {
  advisoryFanout,
  advisoryRevision,
  advisorySafe,
  applicable,
  qualityKinds,
} from '../services/advisories.js';
import { fail } from '../errors.js';
import { advisoryLifecycleRoutes } from './advisory-lifecycle.js';
const content = {
  kind,
  title: short,
  text,
  source: text,
  zoneIds: z.array(id).max(100),
  connectionIds: z.array(id).max(1000).optional(),
  geometry: geometry.nullable().optional(),
  startsAt: instant.nullable().optional(),
  endsAt: instant.nullable().optional(),
  demo: z.boolean().optional(),
};
export function advisoryRoutes(app: Express) {
  route(app, 'get', '/advisories', 'customer', async (db, req) =>
    page(
      req,
      (await applicable(db, req.actor.id, req.query.includeLifted === 'true')).map(
        advisorySafe,
      ),
    ),
  );
  route(app, 'get', '/advisories/:id', 'customer', async (db, req) => {
    const doc = (await applicable(db, req.actor.id, true)).find((v) => v.id === req.params.id);
    if (!doc) fail(404, 'Advisory not found');
    const revisions = (await all(db, 'advisory_revision'))
      .filter((v) => v.advisoryId === doc.id && v.action !== 'draft')
      .map((v) => ({
        version: v.snapshot.version,
        text: v.snapshot.text,
        source: v.snapshot.source,
        action: v.action,
        createdAt: v.createdAt,
      }));
    return { ...advisorySafe(doc), revisions };
  });
  route(app, 'get', '/staff/advisories', 'staff', async (db, req) =>
    page(req, await all(db, 'advisory')),
  );
  route(app, 'get', '/staff/advisories/:id', 'staff', async (db, req) => {
    const doc = await get(db, 'advisory', String(req.params.id));
    return {
      ...doc,
      revisions: (await all(db, 'advisory_revision'))
        .filter((v) => v.advisoryId === doc.id)
        .map((v) => ({
          version: v.snapshot.version,
          text: v.snapshot.text,
          source: v.snapshot.source,
          action: v.action,
          createdAt: v.createdAt,
        })),
    };
  });
  route(app, 'post', '/staff/advisories', 'admin', async (db, req) => {
    const input = z.object(content).strict().parse(req.body);
    if (input.zoneIds.length) await zones(db, input.zoneIds);
    for (const connection of input.connectionIds ?? []) await get(db, 'connection', connection);
    if (!input.zoneIds.length && !input.connectionIds?.length)
      fail(400, 'Advisory requires explicit targets');
    if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt)
      fail(400, 'Invalid advisory interval');
    const result = await create(db, 'advisory', {
      ...input,
      connectionIds: input.connectionIds ?? [],
      geometry: input.geometry ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      demo: input.demo ?? false,
      state: 'draft',
      publishedAt: null,
      liftedAt: null,
      liftReason: null,
      updatedAt: now(),
    });
    await advisoryRevision(db, result, 'draft');
    await event(db, req.actor.id, result.id, 'created', 'Advisory draft created');
    return result;
  });
  route(app, 'patch', '/staff/advisories/:id', 'admin', async (db, req) => {
    const input = z
      .object(content)
      .partial()
      .extend({ expectedVersion: expected, reason: text })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'advisory', String(req.params.id), true);
    version(doc, input.expectedVersion);
    if (doc.state === 'lifted') fail(409, 'Lifted notices cannot be edited');
    if (input.zoneIds?.length) await zones(db, input.zoneIds);
    for (const connection of input.connectionIds ?? []) await get(db, 'connection', connection);
    if (doc.state === 'published' && qualityKinds.includes(doc.kind)) {
      if (
        (input.kind && input.kind !== doc.kind) ||
        (input.zoneIds &&
          JSON.stringify([...input.zoneIds].sort()) !==
            JSON.stringify([...doc.zoneIds].sort())) ||
        (input.connectionIds &&
          JSON.stringify([...input.connectionIds].sort()) !==
            JSON.stringify([...doc.connectionIds].sort()))
      )
        fail(409, 'Explicitly lift quality restrictions before changing kind or targets');
    }
    const { expectedVersion: _e, reason: _r, ...patch } = input;
    const revised = { ...doc, ...patch, updatedAt: now() };
    if (
      !(revised.zoneIds ?? doc.zoneIds).length &&
      !(revised.connectionIds ?? doc.connectionIds).length
    )
      fail(400, 'Advisory requires explicit targets');
    if (revised.startsAt && revised.endsAt && revised.startsAt >= revised.endsAt)
      fail(400, 'Invalid advisory interval');
    const result = await save(db, 'advisory', revised);
    await advisoryRevision(db, result, doc.state === 'published' ? 'revised' : 'draft');
    await event(db, req.actor.id, doc.id, 'revised', input.reason);
    if (doc.state === 'published') await advisoryFanout(db, result, 'revised');
    return result;
  });
  advisoryLifecycleRoutes(app);
}
