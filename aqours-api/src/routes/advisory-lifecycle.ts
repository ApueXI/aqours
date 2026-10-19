import type { Express } from 'express';
import { z } from 'zod';
import { route } from '../http.js';
import { event, get, now, save, version } from '../store.js';
import { expected, text } from '../validation.js';
import {
  advisoryFanout,
  advisoryRevision,
  advisoryPublisher,
  advisoryTargets,
} from '../services/advisories.js';
import { fail } from '../errors.js';

export function advisoryLifecycleRoutes(app: Express) {
  for (const action of ['publish', 'lift'] as const)
    route(app, 'post', `/staff/advisories/:id/${action}`, 'admin', async (db, req) => {
      const input = z
        .object({
          expectedVersion: expected,
          ...(action === 'lift' ? { reason: text } : {}),
        })
        .strict()
        .parse(req.body);
      await advisoryPublisher(db, req);
      const doc = await get(db, 'advisory', String(req.params.id), true);
      version(doc, input.expectedVersion);
      if (action === 'publish') {
        await advisoryTargets(db, doc);
      }
      if (
        (action === 'publish' && doc.state !== 'draft') ||
        (action === 'lift' && doc.state !== 'published')
      )
        fail(409, 'Invalid advisory lifecycle transition');
      const result = await save(db, 'advisory', {
        ...doc,
        state: action === 'publish' ? 'published' : 'lifted',
        updatedAt: now(),
        ...(action === 'publish'
          ? { publishedAt: now() }
          : { liftedAt: now(), liftReason: input.reason }),
      });
      await advisoryRevision(db, result, result.state);
      await event(
        db,
        req.actor.id,
        doc.id,
        result.state,
        String(input.reason ?? 'Advisory published'),
      );
      await advisoryFanout(db, result, result.state);
      return result;
    });
}
