import type { Envelope, User } from '@aqours/contracts';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { request, RequestError, errorText, type RequestOptions } from '@/lib/api';
import { clearIntentions } from '@/lib/operations';

const storageKey = 'aqours.session.v1';
type Stored = { token: string; revocationPending: boolean };
type Api = <T>(path: string, options?: RequestOptions) => Promise<Envelope<T>>;
interface Session {
  user: User | null; token: string | null; loading: boolean; error: string | null;
  pendingRevocation: boolean; api: Api;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>; restore(): Promise<void>;
}
const Context = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevocation, setPendingRevocation] = useState(false);
  const credential = useRef<Stored | null>(null);
  const generation = useRef(0);

  const clear = useCallback(async () => {
    clearIntentions();
    generation.current += 1;
    setUser(null);
    setToken(null);
    credential.current = null;
    await SecureStore.deleteItemAsync(storageKey);
  }, []);

  const revoke = useCallback(async (saved: Stored) => {
    try {
      await request('/auth/logout', { method: 'POST', token: saved.token, body: {} });
    } catch (failure) {
      if (!(failure instanceof RequestError && failure.status === 401)) throw failure;
    }
    await clear();
    setPendingRevocation(false);
  }, [clear]);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await SecureStore.getItemAsync(storageKey);
      if (!raw) return;
      const saved: Stored = JSON.parse(raw);
      if (typeof saved.token !== 'string') throw new Error('Stored session is invalid.');
      credential.current = saved;
      if (saved.revocationPending) {
        setPendingRevocation(true);
        await revoke(saved);
        return;
      }
      const result = await request<{ user: User }>('/auth/session', { token: saved.token });
      if (result.data.user.role !== 'customer') {
        await revoke(saved);
        throw new Error('Use a customer account in this application.');
      }
      setToken(saved.token);
      setUser(result.data.user);
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) {
        await clear();
        setError('Your session has expired or was revoked. Sign in again.');
      } else setError(errorText(failure));
    } finally { setLoading(false); }
  }, [clear, revoke]);

  useEffect(() => {
    // Secure storage and server identity must be verified before private routes mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore();
  }, [restore]);

  const api = useCallback<Api>(async (path, options) => {
    const current = generation.current;
    try {
      return await request(path, { ...options, token });
    } catch (failure) {
      if (current === generation.current && failure instanceof RequestError && failure.status === 401) {
        await clear();
        setError('Your session has expired or was revoked. Sign in again.');
      }
      throw failure;
    }
  }, [token, clear]);

  const login = useCallback(async (email: string, password: string) => {
    if (credential.current?.revocationPending) throw new Error('Retry server sign-out before signing in again.');
    if (credential.current) await revoke(credential.current);
    const result = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST', body: { email: email.trim(), password, client: 'mobile' },
    });
    if (result.data.user.role !== 'customer') throw new Error('A customer account is required.');
    const saved: Stored = { token: result.data.token, revocationPending: false };
    try { await SecureStore.setItemAsync(storageKey, JSON.stringify(saved)); }
    catch {
      await request('/auth/logout', { method: 'POST', token: saved.token, body: {} }).catch(() => undefined);
      throw new Error('The session could not be saved securely. Please sign in again.');
    }
    generation.current += 1;
    clearIntentions();
    credential.current = saved;
    setError(null);
    setToken(saved.token);
    setUser(result.data.user);
  }, [revoke]);

  const logout = useCallback(async () => {
    clearIntentions();
    const saved = credential.current;
    generation.current += 1;
    setUser(null);
    setToken(null);
    setError(null);
    if (!saved) return;
    const pending = { ...saved, revocationPending: true };
    credential.current = pending;
    setPendingRevocation(true);
    let persistenceFailed = false;
    try {
      await SecureStore.setItemAsync(storageKey, JSON.stringify(pending));
    } catch {
      persistenceFailed = true;
      await SecureStore.deleteItemAsync(storageKey).catch(() => undefined);
    }
    try { await revoke(pending); }
    catch (failure) {
      setError(`Server sign-out is not confirmed. ${errorText(failure)}${persistenceFailed ? ' Secure storage also failed; keep this screen open and retry sign-out.' : ''}`);
    }
  }, [revoke]);

  return <Context.Provider value={{ user, token, loading, error, pendingRevocation, api, login, logout, restore }}>{children}</Context.Provider>;
}

export function useSession(): Session {
  const session = useContext(Context);
  if (!session) throw new Error('Session provider is missing.');
  return session;
}
