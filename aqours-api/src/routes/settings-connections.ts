import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, save, version } from '../store.js';
import { coordinates, expected, id, short, text } from '../validation.js';
import { fail } from '../errors.js';
const connectionFields = {
  address: text,
  zoneId: id.nullable().optional(),
  zoneConfirmed: z.boolean(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
};
export function connectionSettingsRoutes(app: Express) {
  route(app, 'get', '/staff/settings/connections', 'admin', async (db, req) =>
    page(req, await all(db, 'connection')),
  );
  route(app, 'post', '/staff/settings/connections', 'admin', async (db, req) => {
    const input = z
      .object({ ...connectionFields, customerId: id, reference: short })
      .strict()
      .parse(req.body);
    const user = await get(db, 'user', input.customerId);
    if (user.role !== 'customer') fail(400, 'Connections require a customer account');
    if (input.zoneId) {
      const zone = await get(db, 'zone', input.zoneId, true);
      if (!zone.active) fail(400, 'Zone is inactive');
    }
    if (input.zoneConfirmed && !input.zoneId) fail(400, 'A confirmed zone requires a zone');
    coordinates(input);
    const doc = await create(
      db,
      'connection',
      {
        ...input,
        zoneId: input.zoneId ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
      user.id,
    );
    await event(
      db,
      req.actor.id,
      doc.id,
      'connection_created',
      'Connection provisioned',
      undefined,
      undefined,
      true,
    );
    return doc;
  });
  route(app, 'patch', '/staff/settings/connections/:id', 'admin', async (db, req) => {
    const input = z
      .object(connectionFields)
      .partial()
      .extend({ expectedVersion: expected, reason: text })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'connection', String(req.params.id), true);
    version(doc, input.expectedVersion);
    const { expectedVersion: _e, reason: _r, ...fields } = input,
      revised = { ...doc, ...fields };
    coordinates(revised);
    if (revised.zoneId) {
      const zone = await get(db, 'zone', revised.zoneId, true);
      if (!zone.active) fail(400, 'Zone is inactive');
    }
    if (revised.zoneConfirmed && !revised.zoneId) fail(400, 'A confirmed zone requires a zone');
    await event(
      db,
      req.actor.id,
      doc.id,
      'connection_updated',
      input.reason,
      undefined,
      undefined,
      true,
    );
    return save(db, 'connection', revised);
  });
}
