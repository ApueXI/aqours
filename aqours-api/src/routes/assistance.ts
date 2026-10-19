import type { Express } from 'express';
import { z } from 'zod';
import { route, page, filter } from '../http.js';
import { all, create, event, get, notify, now, own, reference, save, version } from '../store.js';
import { assistanceType, expected, id, liters, short, text } from '../validation.js';
import {
  eligibleSessions,
  lockRequest,
  lockSession,
  release,
  requestDetail,
} from '../services/stock.js';
import { fail } from '../errors.js';
import { assistanceWorkflowRoutes } from './assistance-workflow.js';
const details = z
  .object({
    question: text.optional(),
    contactMethod: z.literal('phone').optional(),
    contactNumber: short.optional(),
    preferredWindow: text.optional(),
    issueDetails: text.optional(),
    siteAddress: text.optional(),
    accessInstructions: text.optional(),
    requestedLiters: liters.optional(),
    sessionId: id.nullable().optional(),
    notes: text.optional(),
  })
  .strict();
export function assistanceRoutes(app: Express) {
  route(app, 'get', '/pickup-sessions', 'customer', async (db, req) => {
    const reportId = req.query.reportId ? id.parse(req.query.reportId) : null;
    const report = reportId ? await get(db, 'report', reportId) : undefined;
    if (report) own(report, req.actor);
    return page(req, await eligibleSessions(db, req.actor.id, report));
  });
  route(app, 'post', '/assistance-requests', 'customer', async (db, req) => {
    const input = z
      .object({ reportId: id, type: assistanceType, details })
      .strict()
      .parse(req.body);
    const report = await get(db, 'report', input.reportId);
    own(report, req.actor);
    if (
      input.type === 'callback' &&
      (!input.details.question || !input.details.contactNumber || !input.details.preferredWindow)
    )
      fail(400, 'Callback requires question, contact number and preferred window');
    if (
      input.type === 'inspection' &&
      (!input.details.issueDetails ||
        !input.details.siteAddress ||
        !input.details.preferredWindow ||
        !input.details.accessInstructions)
    )
      fail(400, 'Inspection requires issue, address, preferred window and access instructions');
    if (input.type === 'water_support') {
      if (!input.details.requestedLiters) fail(400, 'Requested liters are required');
      if (input.details.sessionId) {
        const session = await lockSession(db, input.details.sessionId);
        if (!report.zoneConfirmed || !session.zoneIds.includes(report.zoneId))
          fail(400, 'Selected pickup session does not serve the confirmed issue zone');
        if (session.status !== 'open' || new Date(session.endsAt).getTime() <= Date.now())
          fail(409, 'Pickup session is unavailable');
      }
    } else if (input.details.sessionId || input.details.requestedLiters)
      fail(400, 'Water fields require water support');
    const result = await create(
      db,
      'assistance',
      {
        ...input,
        customerId: req.actor.id,
        incidentId: report.incidentId,
        reference: reference('HELP'),
        status: 'requested',
        ownerId: null,
        appointmentAt: null,
        outcome: null,
        nextSteps: null,
        reason: null,
        createdAt: now(),
        updatedAt: now(),
      },
      req.actor.id,
      report.id,
    );
    await event(
      db,
      req.actor.id,
      result.id,
      'requested',
      'Request submitted; acceptance and appointments are not guaranteed',
      undefined,
      'requested',
    );
    return requestDetail(db, result);
  });
  for (const staff of [false, true]) {
    const prefix = staff ? '/staff/assistance-requests' : '/assistance-requests',
      access = staff ? 'staff' : 'customer';
    route(app, 'get', prefix, access, async (db, req) =>
      page(
        req,
        await Promise.all(
          filter(
            req,
            await all(db, 'assistance', staff ? undefined : req.actor.id),
            'createdAt',
          ).map((v) => requestDetail(db, v, staff, false)),
        ),
      ),
    );
    route(app, 'get', prefix + '/:id', access, async (db, req) => {
      const doc = await get(db, 'assistance', String(req.params.id));
      if (!staff) own(doc, req.actor);
      return requestDetail(db, doc, staff);
    });
  }
  route(app, 'post', '/assistance-requests/:id/cancel', 'customer', async (db, req) => {
    const input = z.object({ expectedVersion: expected, reason: text }).strict().parse(req.body);
    const { request, session, reserved } = await lockRequest(db, String(req.params.id));
    own(request, req.actor);
    version(request, input.expectedVersion);
    if (request.startedAt || !['requested', 'accepted', 'scheduled'].includes(request.status))
      fail(409, 'Work has begun or request is already final');
    await release(db, reserved, session);
    const key = await event(
      db,
      req.actor.id,
      request.id,
      'cancelled',
      input.reason,
      request.status,
      'cancelled',
    );
    const result = await save(db, 'assistance', {
      ...request,
      status: 'cancelled',
      reason: input.reason,
      updatedAt: now(),
    });
    await notify(
      db,
      request.customerId,
      key,
      'assistance',
      request.id,
      'Assistance cancelled',
      input.reason,
    );
    return requestDetail(db, result);
  });
  assistanceWorkflowRoutes(app);
}
