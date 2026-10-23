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
  const [showPassword, setShowPassword] = useState(false);
  const [attempted, setAttempted] = useState(false);
  if (session.user) return <Redirect href="/" />;
  async function signIn() {
    setAttempted(true);
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
        <Field label="Email" error={attempted && !email.trim() ? 'Enter your email.' : null} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!busy} />
        <Field label="Password" error={attempted && !password ? 'Enter your password.' : null} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="current-password" editable={!busy} />
        <Button title={showPassword ? 'Hide password' : 'Show password'} secondary selected={showPassword} onPress={() => setShowPassword(value => !value)} />
        <ErrorNotice error={error} />
        <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={() => void signIn()} disabled={busy} />
      </Section>}
    </>}
    <Body muted>Use your supplier-provided customer account. Demonstration accounts and connections are fictional.</Body>
  </Screen>;
}
