import { useState } from 'react';
import type { User, Connection } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { AccountForm } from '../components/AccountForm';
import { ConnectionForm } from '../components/ConnectionForm';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { useReferences } from '../../../hooks/useReferences';
import { Pagination } from '../../../components/Pagination';
import { label, ResourceState } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

export function SettingsAccounts() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const resource = useResource<User[]>(`/staff/settings/accounts?offset=${offset}`);
  const connections = useAllRecords<Connection>('/staff/settings/connections');
  const refs = useReferences();
  const refresh = () => { void resource.refresh(); void connections.refresh(); };
  const matches = (item: NonNullable<typeof resource.data>[number]) => `${item.name} ${item.email} ${item.role} ${connections.data?.filter(connection => connection.customerId === item.id).map(connection => `${connection.reference} ${connection.address}`).join(' ') || ''}`.toLowerCase().includes(search.trim().toLowerCase());
  return <><h2>Accounts and connections</h2><p className="hint">Role, password, and activation changes revoke this account’s existing sessions. Account history and owned records are preserved.</p>
    <button onClick={refresh}>Refresh accounts</button><label className="field settings-search"><span>Find accounts on this page</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ResourceState resource={connections} /><ResourceState resource={refs.zones} />
    <ResourceState resource={resource}>{resource.data && <>
      <div className="table-scroll responsive-table"><table className="account-directory-table"><thead><tr><th>Account</th><th>Email</th><th>Role</th><th>State</th><th>Service connections</th><th>Action</th></tr></thead><tbody>
        {resource.data.filter(matches).map(user => <tr key={user.id}><td>{user.name}</td><td data-label="Email">{user.email}</td><td data-label="Role">{label(user.role)}</td><td data-label="State">{user.active ? 'Active' : 'Inactive'}</td>
          <td data-label="Service connections">{connections.data && user.role === 'customer' && !connections.data.some(item => item.customerId === user.id) && <p>No service connection.</p>}{connections.data?.filter(item => item.customerId === user.id).map(item => <div key={item.id}>
            <strong>{item.reference}</strong><p>{item.address}</p><p>{refs.zones.data?.find(zone => zone.id === item.zoneId)?.name || 'Zone not assigned'} · {item.zoneConfirmed ? 'Verified' : 'Needs review'}</p>
            <FormDialog title={`Edit ${item.reference}`} triggerLabel={`Edit ${item.reference}`} triggerDisabled={!refs.zones.data}>
              <ConnectionForm d={item} accounts={[user]} zones={refs.zones.data || []} refresh={refresh} />
            </FormDialog>
          </div>)}{user.role === 'customer' && <FormDialog title={`Add connection for ${user.name}`} triggerLabel="Add connection" triggerDisabled={!refs.zones.data}>
            <ConnectionForm customerId={user.id} accounts={[user]} zones={refs.zones.data || []} refresh={refresh} />
          </FormDialog>}</td>
          <td><FormDialog title={`Edit ${user.name}`} triggerLabel={`Edit ${user.name}`}>
            <AccountForm account={user} zones={refs.zones.data || []} refresh={refresh} />
          </FormDialog></td></tr>)}
      </tbody></table></div>{resource.data.filter(matches).length === 0 && <p>No accounts.</p>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
    <FormDialog title="Create account" triggerLabel="Create account" triggerClassName="primary" triggerDisabled={!refs.zones.data}><AccountForm zones={refs.zones.data || []} refresh={refresh} /></FormDialog>
  </>;
}
