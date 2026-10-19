import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { useSession } from '@/features/auth/hooks/session';
import { errorText, RequestError, type RequestOptions } from '@/services/http-client';
import { acquireIntention, finishIntention, type Intention } from '@/services/operation-intentions';

export function useCommand<T>() {
  const { api, user } = useSession();
  const pending = useRef<{ identity: string; intention: Intention } | null>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  async function execute(path: string, body: unknown, options: Pick<RequestOptions, 'method'> & { fingerprint?: string } = {}) {
    if (running.current) return null;
    const operation = pending.current ?? acquireIntention(user!.id, path, body, options.method === 'PATCH' ? 'PATCH' : 'POST', randomUUID, options.fingerprint);
    pending.current = operation;
    const intention = operation.intention;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await api<T>(intention.path, intention);
      finishIntention(operation.identity);
      pending.current = null;
      setUncertain(false);
      setResult(response.data);
      return response.data;
    } catch (failure) {
      const ambiguous = !(failure instanceof RequestError) || failure.status === 0 || failure.status >= 500;
      setUncertain(ambiguous);
      if (!ambiguous) { finishIntention(operation.identity); pending.current = null; }
      setError(errorText(failure));
      return null;
    } finally { running.current = false; setBusy(false); }
  }

  return { execute, busy, uncertain, error, result, locked: busy || uncertain };
}
