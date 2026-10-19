import { useCallback, useEffect, useRef, useState } from 'react';
import type { Envelope } from '@aqours/contracts';
import { request } from '../api/client';

export function useResource<T>(path: string | null) {
  const [result, setResult] = useState<Envelope<T>>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(Boolean(path));
  const [receivedAt, setReceivedAt] = useState<string>();
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    if (!path) { setResult(undefined); setLoading(false); return; }
    setLoading(true);
    setError(undefined);
    try {
      const next = await request<T>(path);
      if (current === sequence.current) { setResult(next); setReceivedAt(new Date().toISOString()); }
    } catch (problem) { if (current === sequence.current) setError(problem); }
    finally { if (current === sequence.current) setLoading(false); }
  }, [path]);
  useEffect(() => {
    setResult(undefined);
    setReceivedAt(undefined);
    void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);
  return { result, data: result?.data, loading, error, refresh, receivedAt };
}
export type Resource<T> = ReturnType<typeof useResource<T>>;
