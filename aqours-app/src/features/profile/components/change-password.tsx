import { useState } from 'react';
import { Body, Button, ErrorNotice, Field, Section } from '@/components/ui';
import { useCommand } from '@/hooks/use-command';

export function ChangePassword() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const command = useCommand<{ changed: boolean }>();
  async function submit() {
    setValidation(null);
    if (!currentPassword) { setValidation('Enter your current password.'); return; }
    if (newPassword.length < 12) { setValidation('Use at least 12 characters for your new password.'); return; }
    if (newPassword !== confirm) { setValidation('New passwords do not match.'); return; }
    if (newPassword === currentPassword) { setValidation('Choose a different new password.'); return; }
    const result = await command.execute('/me/password', { currentPassword, newPassword });
    if (result) { setCurrent(''); setNew(''); setConfirm(''); }
  }
  return <Section title="Change password">
    {command.result ? <Body>Your password has been changed. Other signed-in sessions have been revoked.</Body> : <>
      <Body muted>Replace your initial password here. If you forgot it, contact the supplier to verify your identity and reset it.</Body>
      <Field label="Current password" secureTextEntry autoCapitalize="none" autoCorrect={false} value={currentPassword} onChangeText={setCurrent} editable={!command.locked} />
      <Field label="New password" hint="At least 12 characters" secureTextEntry autoCapitalize="none" autoCorrect={false} value={newPassword} onChangeText={setNew} editable={!command.locked} />
      <Field label="Confirm new password" secureTextEntry autoCapitalize="none" autoCorrect={false} value={confirm} onChangeText={setConfirm} editable={!command.locked} />
      <ErrorNotice error={validation || command.error} />
      {command.uncertain && <Body>Confirmation is pending. Retry the same password change.</Body>}
      <Button title={command.busy ? 'Changing password…' : command.uncertain ? 'Retry password change' : 'Change password'} disabled={command.busy} onPress={() => void submit()} />
    </>}
  </Section>;
}
