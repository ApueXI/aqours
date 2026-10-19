import { useCallback, useEffect, useState } from 'react';
import type { User } from '@aqours/contracts';
import { request, setCsrfToken } from '../api/client';

type Session = { user: User; csrfToken?: string };
export function useSession() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [ended, setEnded] = useState(false);
  const accept = useCallback((session: Session) => {
    if (session.user.role === 'customer') throw new Error('A supplier account is required.');
    setCsrfToken(session.csrfToken);
    setUser(session.user);
    setEnded(false);
    setError(undefined);
  }, []);
  const restore = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try { accept((await request<Session>('/auth/session')).data); }
    catch (problem) { setError(problem); }
    finally { setLoading(false); }
  }, [accept]);
  useEffect(() => {
    const clear = () => { setUser(undefined); setCsrfToken(undefined); setEnded(true); };
    window.addEventListener('aqours-session-ended', clear);
    void restore();
    return () => window.removeEventListener('aqours-session-ended', clear);
  }, [restore]);
  useEffect(() => {
    if (!user) return;
    const verify = () => {
      if (document.visibilityState === 'hidden') return;
      void request<Session>('/auth/session').then(result => accept(result.data)).catch(() => {
        // Authentication errors dispatch the global session-ended event. Network errors do not imply revocation.
      });
    };
    const interval = window.setInterval(verify, 60000);
    window.addEventListener('focus', verify);
    window.addEventListener('pageshow', verify);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', verify); window.removeEventListener('pageshow', verify); };
  }, [Boolean(user), accept]);
  const login = async (email: string, password: string) => {
    accept((await request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, client: 'web' }) })).data);
  };
  const logout = async () => {
    await request('/auth/logout', { method: 'POST', body: '{}' });
    setCsrfToken(undefined);
    setUser(undefined);
  };
  return { user, loading, error, ended, restore, login, logout };
}
