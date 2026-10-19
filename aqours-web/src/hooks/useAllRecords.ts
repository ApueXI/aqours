import { useCallback, useEffect, useRef, useState } from 'react';
import type { Envelope } from '@aqours/contracts';
import { request } from '../services/http-client';

export async function readAll<T>(path: string): Promise<Envelope<T[]>> {
  const records: T[] = [];
  let offset = 0;
  let result: Envelope<T[]>;
  do {
    result = await request<T[]>(`${path}${path.includes('?') ? '&' : '?'}offset=${offset}&limit=100`);
    records.push(...result.data);
    if (!result.page || result.data.length === 0) break;
    offset += result.data.length;
  } while (offset < result.page.total);
  return { data: records, asOf: result.asOf };
}
export function useAllRecords<T>(path: string | null) {
  const [result, setResult] = useState<Envelope<T[]>>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(Boolean(path));
  const [receivedAt, setReceivedAt] = useState<string>();
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    if (!path) { setResult(undefined); setLoading(false); return; }
    setLoading(true); setError(undefined);
    try { const next = await readAll<T>(path); if (current === sequence.current) { setResult(next); setReceivedAt(new Date().toISOString()); } }
    catch (problem) { if (current === sequence.current) setError(problem); }
    finally { if (current === sequence.current) setLoading(false); }
  }, [path]);
  useEffect(() => {
    setResult(undefined); setReceivedAt(undefined); void refresh();
    return () => { sequence.current += 1; };
  }, [refresh]);
  return { result, data: result?.data, loading, error, refresh, receivedAt };
}
