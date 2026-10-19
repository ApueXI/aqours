import { useState } from 'react';
import type { User } from '@aqours/contracts';
import { label, PageTitle } from '../../../components/Status';
import { SettingsAccounts } from './SettingsAccounts';
import { SettingsConnections } from './SettingsConnections';
import { SettingsZones } from './SettingsZones';
import { SettingsGuidance } from './SettingsGuidance';
import { SettingsAudit } from './SettingsAudit';

export function Settings({ user }: { user: User }) {
  const admin = user.role === 'admin';
  const [tab, setTab] = useState(admin ? 'accounts' : 'guidance');
  const tabs = admin ? ['accounts', 'connections', 'zones', 'guidance', 'audit'] : ['guidance', 'audit'];
  return <><PageTitle title="Settings and audit" /><nav className="tabs flex overflow-x-auto gap-[8px] mb-[20px] [border-bottom:1px_solid_#b8c4ce] [&_button]:[border-width:0_0_3px] [&_button]:[border-style:solid] [&_button]:[border-color:transparent] [&_button]:rounded-none [&_button]:bg-[transparent] [&_button]:whitespace-nowrap [&_button[aria-current]]:[border-bottom-color:#0f766e] [&_button[aria-current]]:text-[#115e59] [&_button[aria-current]]:font-[650]" aria-label="Settings section">
    {tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{label(item)}</button>)}
  </nav><section key={tab}>
    {admin && tab === 'accounts' && <SettingsAccounts />}
    {admin && tab === 'connections' && <SettingsConnections />}
    {admin && tab === 'zones' && <SettingsZones />}
    {tab === 'guidance' && <SettingsGuidance admin={admin} />}
    {tab === 'audit' && <SettingsAudit />}
  </section>{!admin && <p className="hint text-[#475569] text-[13px]">Staff can review approved guidance, recommendation rules, and operational audit history. Account, connection, and zone administration requires an administrator.</p>}</>;
}
