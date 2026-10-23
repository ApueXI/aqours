import { useState } from 'react';
import type { Zone } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { Demo, ResourceState } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

function ZoneForm({ d, refresh }: { d?: Zone; refresh: () => void }) {
  const fields: Field[] = [
    ...(!d ? [{ name: 'code', label: 'Unique zone code', required: true }] : []),
    { name: 'name', label: 'Zone name', value: d?.name, required: true },
    { name: 'boundary', label: 'Display boundary (optional)', type: 'json', value: d?.boundary ? JSON.stringify(d.boundary) : '', nullable: true, hint: 'GeoJSON Polygon / MultiPolygon. A display boundary does not confirm supply connectivity.' },
    { name: 'active', label: 'Active service zone', type: 'checkbox', value: d?.active ?? true },
    ...(d ? [{ name: 'reason', label: 'Change reason', type: 'textarea' as const, required: true }] : [{ name: 'demo', label: 'Fictional demonstration zone', type: 'checkbox' as const }]),
  ];
  return <ActionForm path={d ? `/staff/settings/zones/${d.id}` : '/staff/settings/zones'} method={d ? 'PATCH' : 'POST'} version={d?.version}
    fields={fields} submit={d ? 'Save service zone' : 'Create service zone'} onDone={refresh} />;
}
export function SettingsZones() {
  const resource = useResource<Zone[]>('/staff/settings/zones');
  const [search, setSearch] = useState('');
  const refresh = () => void resource.refresh();
  const matches = (item: NonNullable<typeof resource.data>[number]) => `${item.code} ${item.name}`.toLowerCase().includes(search.trim().toLowerCase());
  return <><h2>Service zones</h2><button onClick={refresh}>Refresh zones</button><label className="field settings-search"><span>Find a zone</span><input value={search} onChange={event => setSearch(event.target.value)} /></label><ResourceState resource={resource}>
    {resource.data?.filter(matches).map(item => <article className="entry" key={item.id}><h3>{item.code} · {item.name}</h3><Demo value={item.demo} />
      <p>{item.active ? 'Active' : 'Inactive'} · {item.boundary ? 'Boundary recorded' : 'No display boundary'}</p><FormDialog title={`Edit ${item.name}`} triggerLabel={`Edit ${item.name}`}>
        <ZoneForm d={item} refresh={refresh} />
      </FormDialog>
    </article>)}{resource.data?.filter(matches).length === 0 && <p>No zones.</p>}
  </ResourceState><FormDialog title="Create service zone" triggerLabel="Create service zone" triggerClassName="primary"><ZoneForm refresh={refresh} /></FormDialog>
  </>;
}
