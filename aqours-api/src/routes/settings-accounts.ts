import type { Express } from 'express';
import { z } from 'zod';
import { route, page } from '../http.js';
import { all, create, event, get, save, userSafe, version } from '../store.js';
import { expected, short, text } from '../validation.js';
import { hashPassword } from '../auth.js';
import { fail } from '../errors.js';
const accountFields = {
  name: short,
  phone: short.nullable().optional(),
  role: z.enum(['customer', 'staff', 'admin']),
  active: z.boolean().optional(),
  password: z.string().min(12).max(200),
};
export function accountSettingsRoutes(app: Express) {
  route(app, 'get', '/staff/settings/accounts', 'admin', async (db, req) =>
    page(req, (await all(db, 'user')).map(userSafe)),
  );
  route(app, 'post', '/staff/settings/accounts', 'admin', async (db, req) => {
    const input = z
        .object({ ...accountFields, email: z.email().max(250) })
        .strict()
        .parse(req.body),
      { password, ...fields } = input;
    const doc = await create(db, 'user', {
      ...fields,
      email: fields.email.toLowerCase(),
      active: fields.active ?? true,
      phone: fields.phone ?? null,
    });
    await db.query('INSERT INTO credentials(user_id,password_hash) VALUES($1,$2)', [
      doc.id,
      hashPassword(password),
    ]);
    await event(
      db,
      req.actor.id,
      doc.id,
      'account_created',
      'Account provisioned',
      undefined,
      undefined,
      true,
    );
    return userSafe(doc);
  });
  route(app, 'patch', '/staff/settings/accounts/:id', 'admin', async (db, req) => {
    const input = z
      .object(accountFields)
      .partial()
      .extend({ expectedVersion: expected, reason: text })
      .strict()
      .parse(req.body);
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended('account-administration',0))");
    const doc = await get(db, 'user', String(req.params.id), true);
    version(doc, input.expectedVersion);
    const { expectedVersion: _e, reason: _r, password, ...fields } = input;
    if (
      doc.role === 'admin' &&
      doc.active &&
      ((fields.role && fields.role !== 'admin') || fields.active === false)
    ) {
      if ((await all(db, 'user')).filter((v) => v.active && v.role === 'admin').length <= 1)
        fail(409, 'The last active administrator must remain active');
    }
    if (fields.role && fields.role !== doc.role) {
      const connections = await all(db, 'connection', doc.id);
      if (connections.length && fields.role !== 'customer')
        fail(409, 'Customer connections must retain customer ownership');
    }
    if (password)
      await db.query('UPDATE credentials SET password_hash=$2 WHERE user_id=$1', [
        doc.id,
        hashPassword(password),
      ]);
    if (
      password ||
      (fields.role !== undefined && fields.role !== doc.role) ||
      (fields.active !== undefined && fields.active !== doc.active)
    )
      await db.query('UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1', [
        doc.id,
      ]);
    await event(
      db,
      req.actor.id,
      doc.id,
      'account_updated',
      input.reason,
      undefined,
      undefined,
      true,
      { fields: Object.keys(fields), passwordReset: !!password },
    );
    return userSafe(await save(db, 'user', { ...doc, ...fields }));
  });
}
