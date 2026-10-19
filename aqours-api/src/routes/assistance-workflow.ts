import type { Express } from 'express';
import { z } from 'zod';
import { route } from '../http.js';
import { event, get, notify, now, save, version } from '../store.js';
import { expected, id, instant, staffOwner, text } from '../validation.js';
import { lockRequest, release, requestDetail, reserve } from '../services/stock.js';
import { fail } from '../errors.js';
export function assistanceWorkflowRoutes(app: Express) {
  route(app, 'post', '/staff/assistance-requests/:id/transition', 'staff', async (db, req) => {
    const input = z
      .object({
        expectedVersion: expected,
        status: z.enum([
          'accepted',
          'scheduled',
          'in_progress',
          'completed',
          'unavailable',
          'cancelled',
        ]),
        reason: text.optional(),
        ownerId: id.optional(),
        appointmentAt: instant.optional(),
        outcome: text.optional(),
        nextSteps: text.optional(),
      })
      .strict()
      .parse(req.body);
    const { request, session, reserved } = await lockRequest(db, String(req.params.id));
    version(request, input.expectedVersion);
    const next: Record<string, string[]> = {
      requested: ['accepted', 'cancelled', 'unavailable'],
      accepted: ['scheduled', 'in_progress', 'cancelled', 'unavailable'],
      scheduled: ['scheduled', 'in_progress', 'cancelled', 'unavailable'],
      in_progress: ['scheduled', 'completed', 'unavailable'],
    };
    if (!next[request.status]?.includes(input.status)) fail(409, 'Invalid assistance transition');
    if (
      ['cancelled', 'unavailable'].includes(input.status) ||
      (input.status === 'in_progress' && request.status === 'accepted') ||
      (input.status === 'scheduled' && ['scheduled', 'in_progress'].includes(request.status))
    ) {
      if (!input.reason) fail(400, 'This transition requires a reason');
    }
    if (input.status === 'scheduled' && !input.appointmentAt)
      fail(400, 'Agreed appointment is required');
    if (input.status === 'completed' && (!input.outcome || !input.nextSteps))
      fail(400, 'Completion requires outcome and next steps');
    if (input.status === 'completed' && request.type === 'water_support')
      fail(409, 'Record water collection through the allocation endpoint');
    if (input.status === 'cancelled' && request.startedAt)
      fail(409, 'Work has already begun; use staff review and unavailable outcome');
    if (
      input.status === 'scheduled' &&
      session &&
      input.appointmentAt &&
      (input.appointmentAt < session.startsAt || input.appointmentAt > session.endsAt)
    )
      fail(400, 'Pickup appointment must fall within the session operating interval');
    const ownerId = input.ownerId ?? request.ownerId;
    await staffOwner(
      db,
      ownerId,
      ['accepted', 'scheduled', 'in_progress', 'completed'].includes(input.status),
    );
    if (input.status === 'accepted' && request.type === 'water_support') {
      if (!session) fail(409, 'No pickup session selected; provide support follow-up');
      await reserve(db, request, session);
    }
    if (['cancelled', 'unavailable'].includes(input.status)) await release(db, reserved, session);
    const key = await event(
      db,
      req.actor.id,
      request.id,
      input.status,
      input.reason ?? input.outcome ?? `Assistance ${input.status}`,
      request.status,
      input.status,
      false,
      {
        oldOwnerId: request.ownerId,
        newOwnerId: ownerId,
        oldAppointmentAt: request.appointmentAt,
        newAppointmentAt: input.appointmentAt ?? request.appointmentAt,
      },
    );
    const { expectedVersion: _e, ...patch } = input;
    const result = await save(db, 'assistance', {
      ...request,
      ...patch,
      ownerId,
      startedAt: request.startedAt ?? (input.status === 'in_progress' ? now() : null),
      updatedAt: now(),
    });
    await notify(
      db,
      request.customerId,
      key,
      'assistance',
      request.id,
      `Assistance ${input.status}`,
      `${input.reason ?? input.outcome ?? 'Supplier updated your request.'}${input.appointmentAt ? ` Appointment: ${input.appointmentAt}` : ''}${input.nextSteps ? ` Next steps: ${input.nextSteps}` : ''}`,
    );
    return requestDetail(db, result, true);
  });
  route(app, 'post', '/staff/assistance-requests/:id/notes', 'staff', async (db, req) => {
    const input = z.object({ text }).strict().parse(req.body),
      doc = await get(db, 'assistance', String(req.params.id));
    return {
      id: await event(db, req.actor.id, doc.id, 'note', input.text, undefined, undefined, true),
      text: input.text,
      authorId: req.actor.id,
      createdAt: now(),
    };
  });
}
