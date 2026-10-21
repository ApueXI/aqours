import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useSession } from '@/features/auth/hooks/session';
import { Body, Button, ErrorNotice, Field, Loading, Screen, Section } from '@/components/ui';
import { errorText } from '@/services/http-client';

export default function Login() {
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (session.user) return <Redirect href="/" />;
  async function signIn() {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    setError(null);
    try { await session.login(email, password); setPassword(''); }
    catch (failure) { setError(errorText(failure)); }
    finally { setBusy(false); }
  }
  return <Screen title="Aqours" navigation={false}>
    <Body>Report water problems, follow service updates, and request assistance.</Body>
    {session.loading ? <Loading text="Checking your session…" /> : <>
      <ErrorNotice error={session.error} retry={() => void session.restore()} />
      {session.pendingRevocation ? <>
        <Body>Private information has been cleared. Retry to confirm server sign-out before using another account.</Body>
        <Button title="Retry server sign-out" onPress={() => void session.logout()} />
      </> : <Section title="Sign in to your account">
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!busy} />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!busy} />
        <ErrorNotice error={error} />
        <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={() => void signIn()} disabled={busy} />
      </Section>}
    </>}
    <Body muted>Use your supplier-provided customer account. Demonstration accounts and connections are fictional.</Body>
  </Screen>;
}
