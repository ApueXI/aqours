import { useState } from 'react';
import type { Connection, User, Zone } from '@aqours/contracts';
import { useResource } from '../hooks/useResource';
import { useReferences } from '../hooks/useReferences';
import { useAllRecords } from '../hooks/useAllRecords';
import { ActionForm, type Field } from '../components/ActionForm';
import { zoneOptions } from '../components/Filters';
import { Pagination } from '../components/Pagination';
import { ResourceState } from '../components/Status';

function ConnectionForm({ d, accounts, zones, refresh }: { d?: Connection; accounts: User[]; zones: Zone[]; refresh: () => void }) {
  const fields: Field[] = [
    ...(!d ? [
      { name: 'customerId', label: 'Customer', type: 'select' as const, required: true, options: accounts.filter(account => account.role === 'customer').map(account => ({ value: account.id, label: `${account.name} · ${account.email}` })) },
      { name: 'reference', label: 'Connection reference', required: true },
    ] : []),
    { name: 'address', label: 'Saved service address', type: 'textarea', required: true, value: d?.address },
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
  const [selected, setSelected] = useState<string>();
  const resource = useResource<Connection[]>(`/staff/settings/connections?offset=${offset}`);
  const accounts = useAllRecords<User>('/staff/settings/accounts');
  const refs = useReferences();
  const connection = resource.data?.find(item => item.id === selected);
  const refresh = () => void resource.refresh();
  return <><h2>Service connections</h2><p className="hint">Saved-address corrections preserve existing report and inspection location snapshots. Unknown zones remain unconfirmed.</p>
    <button onClick={refresh}>Refresh connections</button><ResourceState resource={resource}>{resource.data && <>
      <div className="table-scroll"><table><thead><tr><th>Reference</th><th>Address</th><th>Zone</th><th>Review</th><th>Action</th></tr></thead><tbody>
        {resource.data.map(item => <tr key={item.id}><td>{item.reference}</td><td>{item.address}</td><td>{refs.zones.data?.find(zone => zone.id === item.zoneId)?.name || 'Unknown'}</td>
          <td>{item.zoneConfirmed ? 'Confirmed' : 'Review needed'}</td><td><button onClick={() => setSelected(item.id)}>Edit {item.reference}</button></td></tr>)}
      </tbody></table></div><Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={value => { setOffset(value); setSelected(undefined); }} />
    </>}</ResourceState>
    {connection && <section key={`${connection.id}:${connection.version}`}><h3>Edit {connection.reference}</h3><ConnectionForm d={connection} accounts={accounts.data || []} zones={refs.zones.data || []} refresh={refresh} /></section>}
    <details><summary>Create service connection</summary><ResourceState resource={accounts} /><ConnectionForm accounts={accounts.data || []} zones={refs.zones.data || []} refresh={refresh} /></details>
  </>;
}
