import { useState, type FormEvent } from 'react';
import { RequestError } from '../../../services/http-client';
import { Failure } from '../../../components/Status';

export function Login({ login, error, ended, restore }: {
  login: (email: string, password: string) => Promise<void>; error: unknown; ended: boolean; restore: () => void;
}) {
  const [problem, setProblem] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setProblem(undefined);
    try { await login(String(data.get('email')), String(data.get('password'))); }
    catch (failure) { setProblem(failure); }
    finally { setBusy(false); }
  };
  const restoreError = error && !(error instanceof RequestError && error.status === 401) ? error : undefined;
  return <main className="login [width:min(440px,_calc(100%_-_32px))] [margin:10vh_auto] bg-[#fff] [border:1px_solid_#d3dce3] p-[32px] [border-radius:5px] [&_h1]:text-[22px] [&_form]:mt-[24px] [&_form_button]:w-full [&_form_button]:mb-[20px]"><div className="login-brand text-[24px] font-[700] mb-[24px]">Aqours</div><h1>Supplier sign in</h1>
    <p>Use your staff or administrator account.</p>
    {ended && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Your session ended or was revoked. Sign in again to continue.</p>}
    <Failure error={restoreError} />{restoreError && <button type="button" onClick={restore}>Retry session check</button>}
    <form onSubmit={event => void submit(event)}><fieldset disabled={busy}>
      <label className="field flex flex-col gap-[6px] mb-[16px] max-w-[640px] [&_>_span:first-child]:font-[550]"><span>Email</span><input name="email" type="email" autoComplete="username" required /></label>
      <label className="field flex flex-col gap-[6px] mb-[16px] max-w-[640px] [&_>_span:first-child]:font-[550]"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
      <button className="primary" type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
    </fieldset></form><Failure error={problem} />
    <p className="hint text-[#475569] text-[13px]">Customer accounts use the Aqours mobile application.</p>
  </main>;
}
