import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import { config } from './config.js';
import { pool, type DB } from './db.js';
import { fail } from './errors.js';
import { get, type Doc } from './store.js';
export type ActorRequest = Request & {
  actor: Doc;
  session: { hash: string; client: string; csrf: string };
};
export const digest = (s: string) => createHash('sha256').update(s).digest('hex');
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, encoded: string) {
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  const bytes = Buffer.from(expected, 'hex'),
    actual = scryptSync(password, salt, 64);
  return bytes.length === actual.length && timingSafeEqual(bytes, actual);
}
export function presented(req: Request) {
  const bearer = req.get('authorization');
  if (bearer?.startsWith('Bearer ')) return { token: bearer.slice(7), client: 'mobile' };
  const token = req
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('aqours_session='))
    ?.slice(15);
  return token ? { token, client: 'web' } : null;
}
export function origin(req: Request) {
  if (req.get('origin') !== config.webOrigin) fail(403, 'Origin denied', 'origin');
}
export async function authenticate(req: Request): Promise<ActorRequest> {
  const supplied = presented(req);
  if (!supplied) fail(401, 'Sign in required', 'unauthenticated');
  const hash = digest(supplied.token);
  const { rows } = await pool.query(
    'SELECT user_id,client,csrf FROM sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>now()',
    [hash],
  );
  const session = rows[0];
  if (!session || session.client !== supplied.client)
    fail(401, 'Session expired or revoked', 'unauthenticated');
  const actor = await get(pool, 'user', session.user_id);
  if (!actor.active) fail(401, 'Account is inactive', 'unauthenticated');
  if (session.client === 'web' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    origin(req);
    if (req.get('x-csrf-token') !== session.csrf) fail(403, 'CSRF verification failed', 'csrf');
  }
  return Object.assign(req, {
    actor,
    session: { hash, client: session.client, csrf: session.csrf },
  });
}
export async function sessionCreate(db: DB, user: Doc, client: string, res: Response) {
  const token = randomBytes(32).toString('base64url'),
    csrfToken = randomBytes(32).toString('base64url');
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,client,csrf,expires_at) VALUES($1,$2,$3,$4,now()+$5*interval '1 day')",
    [digest(token), user.id, client, csrfToken, config.sessionDays],
  );
  if (client === 'web')
    res.cookie('aqours_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.production,
      path: '/api/v1',
      maxAge: config.sessionDays * 86400000,
    });
  return client === 'web' ? { csrfToken } : { token };
}
