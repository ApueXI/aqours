import type { Envelope } from '@aqours/contracts';

const configured = import.meta.env?.VITE_API_URL as string | undefined;
export const apiBase = (configured || 'http://localhost:4000/api/v1').replace(/\/$/, '');
let csrfToken: string | undefined;
export function setCsrfToken(value?: string) {
  csrfToken = value;
  if (value === undefined) unresolved.clear();
}

export class RequestError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function errorText(error: unknown): string {
  if (error instanceof RequestError) {
    if (error.status === 409) return `${error.message} Refresh this record and review the current state before a new action.`;
    if (error.status === 429) return 'Too many attempts. Wait a moment and try again.';
    return error.message;
  }
  return 'The service could not be reached. Check your connection and retry.';
}
export type Intent = { path: string; method: 'POST' | 'PATCH'; key: string; body: string };
const unresolved = new Map<string, Intent>();
const fingerprint = (intent: Pick<Intent, 'path' | 'method' | 'body'>) => `${intent.method}:${intent.path}:${intent.body}`;
export function createIntent(path: string, method: Intent['method'], body: unknown): Intent {
  const draft = { path, method, body: JSON.stringify(body) };
  const original = unresolved.get(fingerprint(draft));
  if (original) return original;
  const intent = { ...draft, key: crypto.randomUUID() };
  unresolved.set(fingerprint(intent), intent);
  return intent;
}
export async function request<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('Content-Type', 'application/json');
  if (init?.method && init.method !== 'GET' && csrfToken) headers.set('X-CSRF-Token', csrfToken);
  let response: Response;
  try { response = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: 'include', cache: 'no-store' }); }
  catch { throw new RequestError(0, 'network', 'Connection lost. The action may have reached the server. Retry the same action to confirm its result.'); }
  let body: { error?: { code: string; message: string } } & Envelope<T>;
  try { body = await response.json(); }
  catch { throw new RequestError(response.ok ? 0 : response.status, 'invalid_response', 'The service returned an unreadable response. Retry to confirm the result.'); }
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('aqours-session-ended'));
    throw new RequestError(response.status, body?.error?.code || 'request_failed', body?.error?.message || 'Request failed.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.hasOwn(body, 'data')) {
    throw new RequestError(0, 'invalid_response', 'The result could not be verified. Retry the same action to confirm its result.');
  }
  return body;
}
export async function sendIntent<T>(intent: Intent): Promise<Envelope<T>> {
  try {
    const result = await request<T>(intent.path, { method: intent.method, body: intent.body, headers: { 'Idempotency-Key': intent.key } });
    unresolved.delete(fingerprint(intent));
    return result;
  } catch (error) {
    if (error instanceof RequestError && error.status >= 400 && error.status < 500) unresolved.delete(fingerprint(intent));
    throw error;
  }
}
export function query(values: Record<string, string | number | undefined>): string {
  const entries = Object.entries(values).filter(([, value]) => value !== undefined && value !== '');
  const params = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return params.size ? `?${params}` : '';
}
