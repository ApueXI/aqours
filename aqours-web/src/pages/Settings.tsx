import { useState } from 'react';
import type { User } from '@aqours/contracts';
import { label, PageTitle } from '../components/Status';
import { SettingsAccounts } from './SettingsAccounts';
import { SettingsConnections } from './SettingsConnections';
import { SettingsZones } from './SettingsZones';
import { SettingsGuidance } from './SettingsGuidance';
import { SettingsAudit } from './SettingsAudit';

export function Settings({ user }: { user: User }) {
  const admin = user.role === 'admin';
  const [tab, setTab] = useState(admin ? 'accounts' : 'guidance');
  const tabs = admin ? ['accounts', 'connections', 'zones', 'guidance', 'audit'] : ['guidance', 'audit'];
  return <><PageTitle title="Settings and audit" /><nav className="tabs" aria-label="Settings section">
    {tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{label(item)}</button>)}
  </nav><section key={tab}>
    {admin && tab === 'accounts' && <SettingsAccounts />}
    {admin && tab === 'connections' && <SettingsConnections />}
    {admin && tab === 'zones' && <SettingsZones />}
    {tab === 'guidance' && <SettingsGuidance admin={admin} />}
    {tab === 'audit' && <SettingsAudit />}
  </section>{!admin && <p className="hint">Staff can review approved guidance, recommendation rules, and operational audit history. Account, connection, and zone administration requires an administrator.</p>}</>;
}
