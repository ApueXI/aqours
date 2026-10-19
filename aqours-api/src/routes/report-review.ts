import type { Express } from 'express';
import { z } from 'zod';
import { route } from '../http.js';
import { event, get, notify, now, save, version } from '../store.js';
import { expected, id, staffOwner, text } from '../validation.js';
import { reportSafe } from '../services/reports.js';
import { fail } from '../errors.js';
export function reportReviewRoutes(app: Express) {
  route(app, 'patch', '/staff/reports/:id', 'staff', async (db, req) => {
    const input = z
      .object({
        expectedVersion: expected,
        reason: text,
        status: z.enum(['received', 'under_review', 'in_progress', 'resolved']).optional(),
        ownerId: id.nullable().optional(),
        priority: z.enum(['normal', 'high', 'urgent']).optional(),
        closureOutcome: z.enum(['restored', 'duplicate', 'invalid']).optional(),
        zoneId: id.nullable().optional(),
        zoneConfirmed: z.boolean().optional(),
      })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'report', String(req.params.id), true);
    version(doc, input.expectedVersion);
    await staffOwner(db, input.ownerId);
    const finalZone = { ...doc, ...input };
    if (finalZone.zoneConfirmed && !finalZone.zoneId) fail(400, 'Confirmed zone requires a zone');
    if (finalZone.zoneId) {
      const zone = await get(db, 'zone', finalZone.zoneId, true);
      if (!zone.active) fail(400, 'Selected service zone is inactive');
    }
    if (input.status && input.status !== doc.status) {
      const next: Record<string, string> = {
        received: 'under_review',
        under_review: 'in_progress',
        in_progress: 'resolved',
      };
      const reviewed =
        input.status === 'resolved' &&
        ['duplicate', 'invalid'].includes(input.closureOutcome ?? '') &&
        doc.status !== 'resolved';
      if (next[doc.status] !== input.status && !reviewed) fail(409, 'Invalid report transition');
      if (input.status === 'resolved') {
        if (!input.closureOutcome) fail(400, 'Closure outcome is required');
        doc.closureOutcome = input.closureOutcome;
        doc.closureReason = input.reason;
        if (input.closureOutcome === 'restored' && !doc.firstResolvedAt)
          doc.firstResolvedAt = now();
      }
    } else if (input.closureOutcome) fail(400, 'Closure outcome requires resolution transition');
    const oldStatus = doc.status;
    const { expectedVersion: _e, reason: _r, ...patch } = input;
    if (patch.priority) doc.priorityReason = input.reason;
    Object.assign(doc, patch);
    if (input.zoneId !== undefined || input.zoneConfirmed !== undefined)
      doc.locationReview = !doc.zoneConfirmed || doc.latitude == null;
    const result = await save(db, 'report', doc);
    const key = await event(
      db,
      req.actor.id,
      doc.id,
      'reviewed',
      input.reason,
      oldStatus,
      result.status,
      false,
      { changes: patch },
    );
    await notify(
      db,
      doc.customerId,
      key,
      'report',
      doc.id,
      'Report reviewed',
      `Status: ${result.status}. ${input.reason}`,
    );
    return reportSafe(result);
  });
  route(app, 'post', '/staff/reports/:id/link', 'staff', async (db, req) => {
    const input = z
      .object({ expectedVersion: expected, incidentId: id.nullable(), reason: text })
      .strict()
      .parse(req.body);
    const doc = await get(db, 'report', String(req.params.id), true);
    version(doc, input.expectedVersion);
    if (input.incidentId) await get(db, 'incident', input.incidentId);
    await event(
      db,
      req.actor.id,
      doc.id,
      'incident_link',
      input.reason,
      undefined,
      undefined,
      false,
      { oldIncidentId: doc.incidentId, newIncidentId: input.incidentId },
    );
    return reportSafe(await save(db, 'report', { ...doc, incidentId: input.incidentId }));
  });
  route(app, 'post', '/staff/reports/:id/notes', 'staff', async (db, req) => {
    const input = z.object({ text }).strict().parse(req.body),
      doc = await get(db, 'report', String(req.params.id));
    return {
      id: await event(db, req.actor.id, doc.id, 'note', input.text, undefined, undefined, true),
      text: input.text,
      authorId: req.actor.id,
      createdAt: now(),
    };
  });
}
