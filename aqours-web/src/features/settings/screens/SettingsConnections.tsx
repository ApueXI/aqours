import { useState } from 'react';
import type { Connection, User, Zone } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { zoneOptions } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { ResourceState } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

function ConnectionForm({ d, accounts, zones, refresh }: { d?: Connection; accounts: User[]; zones: Zone[]; refresh: () => void }) {
  const fields: Field[] = [
    ...(!d ? [
      { name: 'customerId', label: 'Customer', type: 'select' as const, required: true, options: accounts.filter(account => account.role === 'customer').map(account => ({ value: account.id, label: `${account.name} · ${account.email}` })) },
      { name: 'reference', label: 'Connection reference', required: true },
    ] : []),
    { name: 'address', label: 'Saved service address', type: 'address', required: true, value: d?.address, snapshot: d?.structuredAddress },
    { name: 'zoneId', label: 'Explicit service zone', type: 'select', value: d?.zoneId, options: zoneOptions(zones), nullable: true },
    { name: 'zoneConfirmed', label: 'Service zone association reviewed', type: 'checkbox', value: d?.zoneConfirmed },
    { name: 'latitude', label: 'Latitude (optional)', type: 'number', min: -90, max: 90, step: 'any', value: d?.latitude, nullable: true },
    { name: 'longitude', label: 'Longitude (optional)', type: 'number', min: -180, max: 180, step: 'any', value: d?.longitude, nullable: true },
    ...(d ? [{ name: 'reason', label: 'Location / association correction reason', type: 'textarea' as const, required: true }] : []),
  ];
  return <ActionForm path={d ? `/staff/settings/connections/${d.id}` : '/staff/settings/connections'} method={d ? 'PATCH' : 'POST'}
    version={d?.version} fields={fields} submit={d ? 'Save connection' : 'Create connection'} onDone={refresh} />;
}
export function SettingsConnections() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const resource = useResource<Connection[]>(`/staff/settings/connections?offset=${offset}`);
  const accounts = useAllRecords<User>('/staff/settings/accounts');
  const refs = useReferences();
  const refresh = () => void resource.refresh();
  const matches = (item: NonNullable<typeof resource.data>[number]) => `${item.reference} ${item.address}`.toLowerCase().includes(search.trim().toLowerCase());
  return <><h2>Service connections</h2><p className="hint">Saved-address corrections preserve existing report and inspection location snapshots. Unknown zones remain unconfirmed.</p>
    <button onClick={refresh}>Refresh connections</button><ResourceState resource={accounts} />
    <label className="field settings-search"><span>Find connections on this page</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ResourceState resource={resource}>{resource.data && <>
      <div className="table-scroll responsive-table"><table className="connection-directory-table"><thead><tr><th>Reference</th><th>Address</th><th>Zone</th><th>Review</th><th>Action</th></tr></thead><tbody>
        {resource.data.filter(matches).map(item => <tr key={item.id}><td>{item.reference}</td><td data-label="Address">{item.address}</td><td data-label="Zone">{refs.zones.data?.find(zone => zone.id === item.zoneId)?.name || 'Unknown'}</td>
          <td data-label="Review">{item.zoneConfirmed ? 'Confirmed' : 'Review needed'}</td><td><FormDialog title={`Edit ${item.reference}`} triggerLabel={`Edit ${item.reference}`} triggerDisabled={refs.zones.loading || refs.zones.data === undefined}>
            <ConnectionForm d={item} accounts={accounts.data || []} zones={refs.zones.data || []} refresh={refresh} />
          </FormDialog></td></tr>)}
      </tbody></table></div>{resource.data.filter(matches).length === 0 && <p>No connections match this page.</p>}<Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
    <FormDialog title="Create service connection" triggerLabel="Create service connection" triggerClassName="primary"
      triggerDisabled={accounts.loading || accounts.data === undefined || refs.zones.loading || refs.zones.data === undefined}>
      <ConnectionForm accounts={accounts.data || []} zones={refs.zones.data || []} refresh={refresh} />
    </FormDialog>
  </>;
}
