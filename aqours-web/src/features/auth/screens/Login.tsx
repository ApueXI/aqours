import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RequestError } from '../../../services/http-client';
import { Failure } from '../../../components/Status';
import { Brand } from '../../../components/Brand';

export function Login({ login, error, ended, restore }: {
  login: (email: string, password: string) => Promise<void>; error: unknown; ended: boolean; restore: () => void;
}) {
  const [problem, setProblem] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { if (problem) feedback.current?.focus(); }, [problem]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setProblem(undefined);
    try { await login(String(data.get('email')), String(data.get('password'))); }
    catch (failure) { setProblem(failure); }
    finally { setBusy(false); }
  };
  const restoreError = error && !(error instanceof RequestError && error.status === 401) ? error : undefined;
  return <main className="login"><div className="login-brand"><Brand /></div><h1>Supplier sign in</h1>
    <p>Use your staff or administrator account.</p>
    {ended && <p className="notice">Your session ended or was revoked. Sign in again to continue.</p>}
    <Failure error={restoreError} />{restoreError && <button type="button" onClick={restore}>Retry session check</button>}
    <form onSubmit={event => void submit(event)}><fieldset disabled={busy}>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="username" required /></label>
      <div className="password-control"><label className="field"><span>Password</span><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /></label><button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide password' : 'Show password'}</button></div>
      <button className="primary" type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
    </fieldset></form><div ref={feedback} tabIndex={problem ? -1 : undefined}><Failure error={problem} /></div>
    <p className="hint login-support">Customer accounts use the Aqours mobile application.</p>
  </main>;
}
