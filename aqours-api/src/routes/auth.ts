import type { Express } from 'express';
import { z } from 'zod';
import { pool, transaction } from '../db.js';
import { digest, origin, presented, sessionCreate, verifyPassword } from '../auth.js';
import { config } from '../config.js';
import { fail } from '../errors.js';
import { all, get, userSafe } from '../store.js';
import { route } from '../http.js';
import { zoneSafe, connectionSafe } from '../services/projection.js';
const attempts = new Map<string, { count: number; until: number }>();
export function authRoutes(app: Express) {
  app.post('/api/v1/auth/login', async (req, res, next) => {
    try {
      const key = req.ip ?? 'unknown',
        time = Date.now();
      let bucket = attempts.get(key);
      if (!bucket || bucket.until < time) {
        bucket = { count: 0, until: time + 60000 };
        attempts.set(key, bucket);
      }
      if (++bucket.count > 12)
        fail(429, 'Too many login attempts; try again shortly', 'rate_limit');
      const input = z
        .object({
          email: z.email().max(250),
          password: z.string().min(1).max(200),
          client: z.enum(['web', 'mobile']),
        })
        .strict()
        .parse(req.body);
      if (input.client === 'web') origin(req);
      const result = await transaction(async (db) => {
        const { rows } = await db.query(
          "SELECT id FROM records WHERE kind='user' AND lower(data->>'email')=$1 FOR UPDATE",
          [input.email.toLowerCase()],
        );
        const user = rows[0] ? await get(db, 'user', rows[0].id) : null;
        const credentials = user
          ? await db.query('SELECT password_hash FROM credentials WHERE user_id=$1', [user.id])
          : { rows: [] };
        const encoded =
          credentials.rows[0]?.password_hash ??
          '00000000000000000000000000000000:' + '00'.repeat(64);
        const valid = verifyPassword(input.password, encoded);
        if (!valid || !user) fail(401, 'Invalid email or password', 'unauthenticated');
        if (
          !user.active ||
          (input.client === 'web' && user.role === 'customer') ||
          (input.client === 'mobile' && user.role !== 'customer')
        )
          fail(403, 'Account cannot use this application', 'forbidden');
        const session = await sessionCreate(db, user, input.client, res);
        return { user: userSafe(user), ...session };
      });
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  });
  app.post('/api/v1/auth/logout', async (req, res, next) => {
    try {
      const credentials = presented(req);
      if (credentials?.client !== 'mobile') origin(req);
      if (credentials?.client === 'web') {
        const { rows } = await pool.query(
          'SELECT csrf FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',
          [digest(credentials.token)],
        );
        if (rows[0] && req.get('x-csrf-token') !== rows[0].csrf)
          fail(403, 'CSRF verification failed', 'csrf');
      }
      if (credentials)
        await pool.query(
          'UPDATE sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_hash=$1',
          [digest(credentials.token)],
        );
      res.clearCookie('aqours_session', {
        path: '/api/v1',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.production,
      });
      res.json({ data: { loggedOut: true } });
    } catch (error) {
      next(error);
    }
  });
  route(app, 'get', '/auth/session', 'any', async (_db, req) => ({
    user: userSafe(req.actor),
    ...(req.session.client === 'web' ? { csrfToken: req.session.csrf } : {}),
  }));
  route(app, 'get', '/me', 'any', async (_db, req) => userSafe(req.actor));
  route(app, 'get', '/me/connections', 'customer', async (db, req) =>
    (await all(db, 'connection', req.actor.id)).map(connectionSafe),
  );
  route(app, 'get', '/zones', 'any', async (db) =>
    (await all(db, 'zone')).filter((v) => v.active).map(zoneSafe),
  );
  route(app, 'get', '/staff/zones', 'staff', async (db) => (await all(db, 'zone')).map(zoneSafe));
  route(app, 'get', '/staff/users', 'staff', async (db) =>
    (await all(db, 'user')).filter((v) => v.active && v.role !== 'customer').map(userSafe),
  );
  route(app, 'get', '/staff/connections', 'staff', async (db) =>
    (await all(db, 'connection')).map(connectionSafe),
  );
}
