import type { Envelope } from '@aqours/contracts';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSession } from '@/features/auth/hooks/session';
import { errorText, RequestError } from '@/services/http-client';
import { fetchAllPages, type PageFetcher } from '@/utils/pagination';

type Loader<T> = (fetch: PageFetcher, path: string) => Promise<Envelope<T>>;
type Resource<T> = { identity: string; result: Envelope<T> | null; receivedAt: string | null; loading: boolean; error: string | null };

export function useResource<T>(path: string | null, poll = false, load?: Loader<T>) {
  const { api, user } = useSession();
  const identity = `${user?.id ?? ''}:${path ?? ''}`;
  const [state, setState] = useState<Resource<T>>({ identity, result: null, receivedAt: null, loading: !!path, error: null });
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const run = ++sequence.current;
    // Retain the same account/record subtree while a picker or permission dialog
    // returns to the foreground. Changing identity never exposes cached records.
    setState(previous => ({ identity, result: previous.identity === identity ? previous.result : null,
      receivedAt: previous.identity === identity ? previous.receivedAt : null, loading: !!path, error: null }));
    if (!path) return;
    try {
      const response = load ? await load(api, path) : await api<T>(path);
      if (run === sequence.current) setState({ identity, result: response, receivedAt: new Date().toISOString(), loading: false, error: null });
    } catch (failure) {
      if (run === sequence.current) {
        const denied = failure instanceof RequestError && [401, 403, 404].includes(failure.status);
        setState(previous => ({ identity, result: !denied && previous.identity === identity ? previous.result : null,
          receivedAt: !denied && previous.identity === identity ? previous.receivedAt : null, loading: false, error: errorText(failure) }));
      }
    }
  }, [path, api, load, identity]);

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
  const current = state.identity === identity ? state : { result: null, receivedAt: null, loading: !!path, error: null };
  return { data: current.result?.data ?? null, page: current.result?.page, loading: current.loading, error: current.error,
    stale: !!current.result && (current.loading || !!current.error), receivedAt: current.receivedAt, reload };
}

export function useAllResources<T>(path: string, poll = false) {
  const load = useCallback((fetch: PageFetcher, target: string) => fetchAllPages<T>(fetch, target), []);
  return useResource<T[]>(path, poll, load);
}
