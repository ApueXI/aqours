export interface Intention {
  path: string; body: unknown; key: string; method: 'POST' | 'PATCH';
}

// Survives route refetch/unmount, but is cleared when the authenticated account changes.
const pending = new Map<string, Intention>();

export function acquireIntention(actor: string, path: string, body: unknown, method: Intention['method'], createKey: () => string, fingerprint?: string) {
  const identity = `${actor}:${method}:${path}:${fingerprint ?? JSON.stringify(body)}`;
  const existing = pending.get(identity);
  if (existing) return { identity, intention: existing };
  const intention = { path, body, key: createKey(), method };
  pending.set(identity, intention);
  return { identity, intention };
}

export function finishIntention(identity: string) { pending.delete(identity); }
export function clearIntentions() { pending.clear(); }
