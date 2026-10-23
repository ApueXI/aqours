import type { User } from '@aqours/contracts';
import { label, PageTitle } from '../../../components/Status';
import { SettingsAccounts } from './SettingsAccounts';
import { SettingsZones } from './SettingsZones';
import { SettingsGuidance } from './SettingsGuidance';
import { SettingsAudit } from './SettingsAudit';

export function Settings({ user, params }: { user: User; params: URLSearchParams }) {
  const admin = user.role === 'admin';
  const tabs = admin ? ['accounts', 'zones', 'guidance', 'audit'] : ['guidance', 'audit'];
  const requested = params.get('tab') === 'connections' ? 'accounts' : params.get('tab');
  const tab = requested && tabs.includes(requested) ? requested : tabs[0];
  const tasks: Record<string, string> = { accounts: 'Provision accounts or select an account to change access.', connections: 'Find a service connection before correcting its saved address or zone.', zones: 'Review zone boundaries and activation; changes never establish supply connectivity.', guidance: 'Review immutable approved text and recommendation rules before adding a version.', audit: 'Inspect who changed a record and why. Audit events are retained.' };
  return <><PageTitle title="Settings and audit" /><p className="page-description">{admin ? 'Manage supplier access, service connections, and approved guidance.' : 'Review approved guidance and the operational audit trail.'}</p><nav className="tabs" aria-label="Settings section">
    {tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => { window.location.hash = `/settings?tab=${item}`; }}>{item === 'accounts' ? 'Accounts and connections' : label(item)}</button>)}
  </nav><section key={tab}>
    <div className="settings-section-header"><p>{tasks[tab]}</p></div>
    {admin && tab === 'accounts' && <SettingsAccounts />}
    {admin && tab === 'zones' && <SettingsZones />}
    {tab === 'guidance' && <SettingsGuidance admin={admin} />}
    {tab === 'audit' && <SettingsAudit />}
  </section>{!admin && <p className="hint">Staff can review approved guidance, recommendation rules, and operational audit history. Account, connection, and zone administration requires an administrator.</p>}</>;
}
