import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { User, Connection, Report, AssistanceRequest, PickupSession, Envelope } from '../aqours-contracts/src/index.ts';

export const base = process.env.AQOURS_TEST_API ?? 'http://127.0.0.1:4000/api/v1';
export const origin = new URL(process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173').origin;
export const fixturePassword = 'DemoWater2026!';
export const key = () => randomUUID();
export interface Actor { user: User; token?: string; cookie?: string; csrfToken?: string }
export interface Result<T> { status: number; data: T; body: Envelope<T> & { error?: { code: string; message: string } }; response: Response }

export async function request<T>(actor: Actor | null, method: string, path: string,
  payload?: unknown, operationKey?: string): Promise<Result<T>> {
  const headers: Record<string, string> = { Origin: origin };
  if (actor?.token) headers.Authorization = `Bearer ${actor.token}`;
  if (actor?.cookie) headers.Cookie = actor.cookie;
  if (actor?.csrfToken) headers['X-CSRF-Token'] = actor.csrfToken;
  if (operationKey) headers['Idempotency-Key'] = operationKey;
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload) });
  const raw = await response.text();
  const body = (raw ? JSON.parse(raw) : {data:undefined}) as Result<T>['body'];
  return { status: response.status, data: body.data, body, response };
}
export async function ok<T>(actor: Actor | null, method: string, path: string, payload?: unknown, operationKey = key()): Promise<T> {
  const result = await request<T>(actor, method, path, payload, operationKey);
  assert.ok(result.status >= 200 && result.status < 300, `${method} ${path}: ${result.status} ${JSON.stringify(result.body)}`);
  return result.data;
}
export async function denied(actor: Actor | null, method: string, path: string, payload?: unknown): Promise<void> {
  const result = await request(actor, method, path, payload, key());
  assert.ok([401,403,404].includes(result.status), `${method} ${path}: expected denied, got ${result.status}`);
}
export async function login(email: string, client: 'mobile' | 'web' = 'mobile'): Promise<Actor> {
  const result = await request<{user: User; token?: string; csrfToken?: string}>(null, 'POST', '/auth/login', { email, password: fixturePassword, client });
  assert.equal(result.status, 200, `Login fixture ${email}: ${JSON.stringify(result.body)}`);
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0];
  return { ...result.data, cookie };
}
let cachedActors: Promise<{a:Actor;b:Actor;admin:Actor;staff:Actor}> | undefined;
export function actors() {
  return cachedActors ??= createActors();
}
async function createActors() {
  return {
    a: await login('customer01@demo.aqours.test'), b: await login('customer02@demo.aqours.test'),
    admin: await login('admin@demo.aqours.test','web'), staff: await login('staff@demo.aqours.test','web'),
  };
}
export async function connection(actor: Actor): Promise<Connection> {
  const connections = await ok<Connection[]>(actor, 'GET', '/me/connections');
  assert.ok(connections.length);
  return connections[0];
}
export async function report(actor: Actor, category = 'outage', description = 'Integration fixture: water supply concern'): Promise<Report> {
  return ok<Report>(actor,'POST','/reports', { connectionId:(await connection(actor)).id, category, description, noticedAt: new Date().toISOString() });
}
export async function waterFixture(admin: Actor, zoneId: string, liters = '100.00'): Promise<PickupSession> {
  const site = await ok<{id:string}>(admin,'POST','/staff/pickup-sites', {name:`Integration site ${key()}`,address:'Fictional community hall',instructions:'Demo collection only',demo:true});
  return ok<PickupSession>(admin,'POST','/staff/distribution/sessions', {siteId:site.id,zoneIds:[zoneId],startsAt:new Date(Date.now()-60_000).toISOString(),endsAt:new Date(Date.now()+86_400_000).toISOString(),totalLiters:liters,instructions:'Fictional integration session',demo:true});
}
export async function waterRequest(actor: Actor, session: PickupSession, liters: string): Promise<AssistanceRequest> {
  const item = await report(actor);
  return ok<AssistanceRequest>(actor,'POST','/assistance-requests',{reportId:item.id,type:'water_support',details:{requestedLiters:liters,sessionId:session.id}});
}
export async function transition(actor: Actor, item: AssistanceRequest, status: string, extra: Record<string, unknown> = {}): Promise<AssistanceRequest> {
  return ok<AssistanceRequest>(actor,'POST',`/staff/assistance-requests/${item.id}/transition`, {expectedVersion:item.version,status,reason:'Integration staff decision',...extra});
}
