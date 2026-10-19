import type { Express } from 'express';
import { z } from 'zod';
import { route } from '../http.js';
import { all, create, event, get, notify, now, save, version } from '../store.js';
import { expected, geometry, instant, text } from '../validation.js';
import { updateSafe } from '../services/reports.js';
export function incidentPublicationRoutes(app: Express) {
  route(app, 'post', '/staff/incidents/:id/notes', 'staff', async (db, req) => {
    const input = z.object({ text }).strict().parse(req.body),
      doc = await get(db, 'incident', String(req.params.id));
    return {
      id: await event(db, req.actor.id, doc.id, 'note', input.text, undefined, undefined, true),
      text: input.text,
      authorId: req.actor.id,
      createdAt: now(),
    };
  });
  route(app, 'post', '/staff/incidents/:id/updates', 'staff', async (db, req) => {
    const input = z
      .object({
        expectedVersion: expected,
        progress: text,
        area: text,
        restorationAt: instant.nullable(),
        geometry: geometry.nullable().optional(),
      })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'incident', String(req.params.id), true);
    version(doc, input.expectedVersion);
    const update = await create(
      db,
      'incident_update',
      {
        incidentId: doc.id,
        category: doc.category,
        summary: doc.summary,
        zoneIds: doc.zoneIds,
        status: doc.status,
        progress: input.progress,
        area: input.area,
        restorationAt: input.restorationAt,
        geometry: input.geometry ?? doc.geometry,
        publishedAt: now(),
        demo: doc.demo,
      },
      null,
      doc.id,
    );
    await save(db, 'incident', {
      ...doc,
      area: input.area,
      restorationAt: input.restorationAt,
      geometry: input.geometry ?? doc.geometry,
    });
    await event(db, req.actor.id, doc.id, 'published', input.progress);
    const recipients = new Set(
      (await all(db, 'report')).filter((v) => v.incidentId === doc.id).map((v) => v.customerId),
    );
    for (const customer of recipients)
      await notify(
        db,
        customer,
        update.id,
        'incident',
        doc.id,
        doc.demo ? 'Demo incident update' : 'Incident update',
        input.progress,
      );
    return updateSafe(update);
  });
}
