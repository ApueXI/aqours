import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, save, version } from '../store.js';
import { coordinates, expected, short, text } from '../validation.js';
const siteFields = {
  name: short,
  address: text,
  instructions: text,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function pickupSiteRoutes(app: Express) {
  route(app, 'get', '/staff/pickup-sites', 'staff', async (db, req) =>
    page(req, await all(db, 'site')),
  );
  route(app, 'post', '/staff/pickup-sites', 'staff', async (db, req) => {
    const input = z.object(siteFields).strict().parse(req.body);
    coordinates(input);
    const doc = await create(db, 'site', {
      ...input,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      active: input.active ?? true,
      demo: input.demo ?? false,
    });
    await event(db, req.actor.id, doc.id, 'created', 'Pickup site created');
    return doc;
  });
  route(app, 'patch', '/staff/pickup-sites/:id', 'staff', async (db, req) => {
    const input = z
      .object(siteFields)
      .partial()
      .extend({ expectedVersion: expected, reason: text })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'site', String(req.params.id), true);
    version(doc, input.expectedVersion);
    const { expectedVersion: _e, reason: _r, ...patch } = input;
    const result = { ...doc, ...patch };
    coordinates(result);
    await event(db, req.actor.id, doc.id, 'reviewed', input.reason);
    return save(db, 'site', result);
  });
}
