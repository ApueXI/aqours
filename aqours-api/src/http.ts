import { unlink } from 'node:fs/promises';
import type { Express, Response } from 'express';
import { z } from 'zod';
import { authenticate, type ActorRequest } from './auth.js';
import { operationFingerprint } from './operation-fingerprint.js';
import { transaction, pool, CommitUncertain, type DB } from './db.js';
import { fail } from './errors.js';
import { id, instant, category, assistanceType } from './validation.js';
import type { Doc } from './store.js';
type Handler = (db: DB, req: ActorRequest, res: Response) => Promise<any>;
export function route(
  app: Express,
  method: 'get' | 'post' | 'patch',
  path: string,
  access: 'any' | 'customer' | 'staff' | 'admin',
  handler: Handler,
  idempotent = method !== 'get',
) {
  app[method]('/api/v1' + path, async (raw, res, next) => {
    try {
      const req = await authenticate(raw);
      if (
        (access === 'customer' && req.actor.role !== 'customer') ||
        (access === 'staff' && req.actor.role === 'customer') ||
        (access === 'admin' && req.actor.role !== 'admin')
      )
        fail(403, 'Role denied', 'forbidden');
      for (const value of Object.values(req.params)) id.parse(value);
      const invoke = async (db: DB) => {
        if (!idempotent) return handler(db, req, res);
        const key = id.parse(req.get('idempotency-key'));
        const scope = `${req.method}:${req.path}`;
        const fingerprint = await operationFingerprint(
          req.actor.id,
          scope,
          key,
          req.body ?? {},
        );
        await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
          `${req.actor.id}:${scope}:${key}`,
        ]);
        const { rows } = await db.query(
          'SELECT fingerprint,response FROM operations WHERE actor_id=$1 AND scope=$2 AND key=$3',
          [req.actor.id, scope, key],
        );
        if (rows[0]) {
          if (rows[0].fingerprint !== fingerprint)
            fail(409, 'Operation key reused with different content', 'idempotency_conflict');
          return rows[0].response;
        }
        await db.query(
          'INSERT INTO operations(actor_id,scope,key,fingerprint) VALUES($1,$2,$3,$4)',
          [req.actor.id, scope, key, fingerprint],
        );
        const result = await handler(db, req, res);
        await db.query(
          'UPDATE operations SET response=$4 WHERE actor_id=$1 AND scope=$2 AND key=$3',
          [req.actor.id, scope, key, JSON.stringify(result)],
        );
        return result;
      };
      const value = method === 'get' ? await invoke(pool) : await transaction(invoke);
      if (!res.headersSent)
        res.json(
          value && typeof value === 'object' && 'data' in value ? value : { data: value },
        );
    } catch (error) {
      const pending = (raw as ActorRequest & { pendingAttachment?: string }).pendingAttachment;
      if (pending && !(error instanceof CommitUncertain))
        await unlink(pending).catch(() => undefined);
      next(error);
    }
  });
}
export function page(req: ActorRequest, values: any[]) {
  const offset = z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000)
    .parse(req.query.offset ?? 0);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(req.query.limit ?? 30);
  return {
    data: values.slice(offset, offset + limit),
    page: { offset, limit, total: values.length },
  };
}
export function validateFilters(req: ActorRequest) {
  const reportStates = z.enum(['received', 'under_review', 'in_progress', 'resolved']);
  const assistanceStates = z.enum([
    'requested',
    'accepted',
    'scheduled',
    'in_progress',
    'completed',
    'unavailable',
    'cancelled',
  ]);
  const validators: Record<string, z.ZodType> = {
    category,
    type: assistanceType,
    priority: z.enum(['normal', 'high', 'urgent']),
    zoneId: id,
    ownerId: id,
    status: req.path.includes('assistance-requests') ? assistanceStates : reportStates,
  };
  for (const [name, validator] of Object.entries(validators))
    if (req.query[name] !== undefined) validator.parse(req.query[name]);
}
export function filter(req: ActorRequest, values: Doc[], dateField = 'submittedAt') {
  validateFilters(req);
  const from = req.query.from ? instant.parse(req.query.from) : null,
    to = req.query.to ? instant.parse(req.query.to) : null;
  if (from && to && from >= to) fail(400, 'Invalid date interval');
  for (const name of ['category', 'status', 'zoneId', 'ownerId', 'priority', 'type']) {
    if (req.query[name] && typeof req.query[name] !== 'string') fail(400, 'Invalid filter');
  }
  return values.filter(
    (value) =>
      ['category', 'status', 'zoneId', 'ownerId', 'priority', 'type'].every(
        (name) => !req.query[name] || value[name] === req.query[name],
      ) &&
      (!from || value[dateField] >= from) &&
      (!to || value[dateField] < to),
  );
}
