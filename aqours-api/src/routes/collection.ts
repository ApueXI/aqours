import type { Express } from 'express';
import { z } from 'zod';
import { route } from '../http.js';
import { event, notify, now, save, version } from '../store.js';
import { expected, text } from '../validation.js';
import { lockRequest, requestDetail } from '../services/stock.js';
import { fail } from '../errors.js';
export function collectionRoutes(app: Express) {
  route(app, 'post', '/staff/water-allocations/:id/collect', 'staff', async (db, req) => {
    const input = z
      .object({
        expectedVersion: expected,
        reason: text.optional(),
        outcome: text,
        nextSteps: text,
      })
      .strict()
      .parse(req.body);
    const { rows } = await db.query('SELECT request_id FROM allocations WHERE id=$1', [
      String(req.params.id),
    ]);
    if (!rows[0]) fail(404, 'Allocation not found');
    const { request, session, reserved } = await lockRequest(db, rows[0].request_id);
    version(request, input.expectedVersion);
    if (!session || session.status !== 'open' || reserved?.state !== 'reserved')
      fail(409, 'Allocation is no longer collectible');
    if (
      !['scheduled', 'in_progress'].includes(request.status) &&
      !(request.status === 'accepted' && input.reason)
    )
      fail(409, 'Schedule collection or record immediate support reason');
    await db.query(
      "UPDATE allocations SET state='collected',collected_at=now() WHERE id=$1 AND state='reserved'",
      [reserved.id],
    );
    await save(db, 'pickup_session', { ...session, updatedAt: now() });
    const key = await event(
      db,
      req.actor.id,
      request.id,
      'collected',
      input.outcome,
      request.status,
      'completed',
    );
    const result = await save(db, 'assistance', {
      ...request,
      status: 'completed',
      reason: input.reason ?? null,
      outcome: input.outcome,
      nextSteps: input.nextSteps,
      updatedAt: now(),
    });
    await notify(
      db,
      request.customerId,
      key,
      'assistance',
      request.id,
      'Water collected',
      `${input.outcome} ${input.nextSteps}`,
    );
    return requestDetail(db, result, true);
  });
}
