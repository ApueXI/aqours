import type { User } from '@aqours/contracts';
import { label, PageTitle } from '../../../components/Status';
import { SettingsAccounts } from './SettingsAccounts';
import { SettingsConnections } from './SettingsConnections';
import { SettingsZones } from './SettingsZones';
import { SettingsGuidance } from './SettingsGuidance';
import { SettingsAudit } from './SettingsAudit';

export function Settings({ user, params }: { user: User; params: URLSearchParams }) {
  const admin = user.role === 'admin';
  const tabs = admin ? ['accounts', 'connections', 'zones', 'guidance', 'audit'] : ['guidance', 'audit'];
  const requested = params.get('tab');
  const tab = requested && tabs.includes(requested) ? requested : tabs[0];
  return <><PageTitle title="Settings and audit" /><p className="page-description">{admin ? 'Manage supplier access, service connections, and approved guidance.' : 'Review approved guidance and the operational audit trail.'}</p><nav className="tabs" aria-label="Settings section">
    {tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => { window.location.hash = `/settings?tab=${item}`; }}>{label(item)}</button>)}
  </nav><section key={tab}>
    {admin && tab === 'accounts' && <SettingsAccounts />}
    {admin && tab === 'connections' && <SettingsConnections />}
    {admin && tab === 'zones' && <SettingsZones />}
    {tab === 'guidance' && <SettingsGuidance admin={admin} />}
    {tab === 'audit' && <SettingsAudit />}
  </section>{!admin && <p className="hint">Staff can review approved guidance, recommendation rules, and operational audit history. Account, connection, and zone administration requires an administrator.</p>}</>;
}
