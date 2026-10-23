import type { MonitoredSite, PickupSite } from '@aqours/contracts';
import { useEffect, useState } from 'react';
import { Demo, EmptyState } from '../../../components/Status';
import { SiteForm } from './DistributionForms';
import { MonitoringConfigForm } from './MonitoringConfigForm';
import { FormDialog } from '../../../components/FormDialog';

export function DistributionSites({ items, sites, refresh }: { items: MonitoredSite[]; sites: PickupSite[]; refresh: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const selected = sites.find(site => site.id === selectedId);
  const monitoring = items.find(item => item.site.id === selectedId);
  const visible = sites.filter(site => `${site.name} ${site.address}`.toLowerCase().includes(search.trim().toLowerCase()));
  useEffect(() => { if (selectedId) document.getElementById('pickup-site-editor')?.focus(); }, [selectedId]);
  return <section><h2>Pickup sites</h2>{sites.length === 0 && <EmptyState title="No pickup sites."><p>Add the site address and pickup instructions before creating a session.</p></EmptyState>}
    <label className="field"><span>Find a pickup site</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <div className="table-scroll responsive-table"><table className="pickup-site-table"><thead><tr><th>Pickup site</th><th>Address</th><th>State / location</th><th>Manage</th></tr></thead><tbody>
      {visible.map(site => <tr key={site.id} aria-selected={site.id === selectedId}><td>{site.name}<Demo value={site.demo} /></td><td data-label="Address">{site.address}</td>
        <td data-label="State / location">{site.active ? 'Active' : 'Inactive'}<div className="hint">{site.latitude === null || site.longitude === null ? 'Coordinates missing; forecast unavailable' : 'Saved coordinates'}</div></td>
        <td><button type="button" aria-label={`Manage pickup site ${site.name}`} onClick={() => setSelectedId(site.id)}>Manage site</button></td></tr>)}
    </tbody></table></div>{sites.length > 0 && visible.length === 0 && <p>No pickup sites match this search.</p>}
    {selected && <section id="pickup-site-editor" className="settings-editor" tabIndex={-1}>
      <h3>{selected.name}</h3><button type="button" onClick={() => setSelectedId('')}>Close site editor</button><p>{selected.instructions}</p>
      {selected.latitude === null || selected.longitude === null ? <p className="notice">Coordinates missing. Forecasts require a saved location.</p> : <p className="hint">{selected.latitude}, {selected.longitude}</p>}
      <FormDialog title={`Edit pickup site · ${selected.name}`} triggerLabel="Edit pickup site"><SiteForm d={selected} refresh={refresh} /></FormDialog>
      {monitoring ? <MonitoringConfigForm item={monitoring} refresh={refresh} /> : <p>Load monitoring data to configure this site.</p>}
    </section>}
    <FormDialog title="Create pickup site" triggerLabel="Create pickup site" triggerClassName="primary"><SiteForm refresh={refresh} /></FormDialog>
  </section>;
}
