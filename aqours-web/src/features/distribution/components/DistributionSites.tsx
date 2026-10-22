import type { MonitoredSite, PickupSite } from '@aqours/contracts';
import { Demo, EmptyState } from '../../../components/Status';
import { SiteForm } from './DistributionForms';
import { MonitoringConfigForm } from './MonitoringConfigForm';

export function DistributionSites({ items, sites, refresh }: { items: MonitoredSite[]; sites: PickupSite[]; refresh: () => void }) {
  return <section><h2>Pickup sites</h2>{sites.length === 0 && <EmptyState title="No pickup sites."><p>Add the site address and pickup instructions before creating a session.</p></EmptyState>}
    {sites.map(site => { const item = items.find(entry => entry.site.id === site.id); return <article className="entry" key={site.id}><h3>{site.name} · {site.active ? 'Active' : 'Inactive'}</h3><Demo value={site.demo} /><p>{site.address}</p><p>{site.instructions}</p>
      {site.latitude === null || site.longitude === null ? <p className="notice">Coordinates missing. This site remains in the list; forecasts require a saved location.</p> : <p className="hint">{site.latitude}, {site.longitude}</p>}
      <details><summary>Edit pickup site</summary><SiteForm key={site.version} d={site} refresh={refresh} /></details>
      <details><summary>Configure monitoring for {site.name}</summary>{item ? <MonitoringConfigForm item={item} refresh={refresh} /> : <p>Load monitoring data to configure this site.</p>}</details>
    </article>; })}
    <details><summary>Create pickup site</summary><SiteForm refresh={refresh} /></details>
  </section>;
}
