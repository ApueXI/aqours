import type { Envelope } from '@aqours/contracts';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/auth/session';
import { errorText } from '@/lib/api';
import { fetchAllPages, type PageFetcher } from '@/lib/pagination';

type Loader<T> = (fetch: PageFetcher, path: string) => Promise<Envelope<T>>;

export function useResource<T>(path: string | null, poll = false, load?: Loader<T>) {
  const { api } = useSession();
  const [result, setResult] = useState<Envelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const run = ++sequence.current;
    setResult(null);
    setError(null);
    if (!path) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = load ? await load(api, path) : await api<T>(path);
      if (run === sequence.current) setResult(response);
    } catch (failure) {
      if (run === sequence.current) setError(errorText(failure));
    } finally { if (run === sequence.current) setLoading(false); }
  }, [path, api, load]);

  useFocusEffect(useCallback(() => {
    void reload();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    const timer = poll ? setInterval(() => {
      if (AppState.currentState === 'active') void reload();
    }, 30000) : null;
    return () => {
      sequence.current += 1;
      subscription.remove();
      if (timer) clearInterval(timer);
    };
  }, [reload, poll]));
  return { data: result?.data ?? null, page: result?.page, loading, error, reload };
}

export function useAllResources<T>(path: string, poll = false) {
  const load = useCallback((fetch: PageFetcher, target: string) => fetchAllPages<T>(fetch, target), []);
  return useResource<T[]>(path, poll, load);
}
