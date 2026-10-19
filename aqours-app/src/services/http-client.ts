import type { Envelope } from '@aqours/contracts';

export const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const mapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? '';

export class RequestError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  key?: string;
  token?: string | null;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  if (!apiUrl || !/^https?:\/\//.test(apiUrl)) {
    throw new RequestError('Configure the public API address before signing in.', 0, 'CONFIGURATION');
  }
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 20000);
  const multipart = options.body instanceof FormData;
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(!multipart && options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.key ? { 'Idempotency-Key': options.key } : {}),
      },
      body: options.body === undefined ? undefined : multipart ? options.body as FormData : JSON.stringify(options.body),
      signal: abort.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new RequestError(payload?.error?.message ?? `Request failed (${response.status}).`, response.status, payload?.error?.code ?? 'HTTP_ERROR');
    }
    if (!payload || !('data' in payload)) {
      throw new RequestError('The server returned an unreadable response. Retry the same action.', 0, 'INVALID_RESPONSE');
    }
    return payload as Envelope<T>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError('The connection was interrupted. The action may have succeeded; retry it to confirm.', 0, 'NETWORK');
  } finally {
    clearTimeout(timeout);
  }
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
