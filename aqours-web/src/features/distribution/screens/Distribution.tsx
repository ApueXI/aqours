import { useEffect } from 'react';
import type { MonitoringOverview, PickupSite, User } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { date, PageTitle, ResourceState } from '../../../components/Status';
import { distributionLink, distributionState } from '../utils/distribution-state';
import { DistributionSessions } from '../components/DistributionSessions';
import { DistributionSites } from '../components/DistributionSites';
import { MonitoringWorkspace } from '../components/MonitoringWorkspace';
import { MonitoringWarnings, warningHistoryDate } from '../components/MonitoringWarnings';
import { MonitoringNotifications } from '../components/MonitoringNotifications';
import { ReservationLookup } from '../components/ReservationLookup';
import { RefreshForecasts } from '../components/RefreshForecasts';
import { TemperatureBandsForm } from '../components/MonitoringConfigForm';
import '../distribution.css';

export function Distribution({ params, user }: { params: URLSearchParams; user: User }) {
  const monitoring = useResource<MonitoringOverview>('/staff/distribution/monitoring');
  const sites = useAllRecords<PickupSite>('/staff/pickup-sites');
  const state = distributionState(params, monitoring.data?.dates);
  const warningDate = warningHistoryDate(params.get('warningDate'), state.date);
  const change = (values: Record<string, string>) => { window.location.hash = distributionLink(params, values); };
  const refresh = () => { void monitoring.refresh(); void sites.refresh(); };
  useEffect(() => { const timer = window.setInterval(() => void monitoring.refresh(), 30000); return () => window.clearInterval(timer); }, [monitoring.refresh]);
  const siteChoices = sites.data || monitoring.data?.sites.map(item => item.site) || [];
  return <><PageTitle title="Water distribution">
    <RefreshForecasts items={monitoring.data?.sites || []} refresh={refresh} />
    <button className="primary" onClick={() => change({ tab: 'sessions', create: '1' })}>New pickup session</button>
  </PageTitle><ReservationLookup />
    <nav className="tabs" aria-label="Distribution sections">{([
      ['monitoring', 'Monitoring'], ['sessions', 'Sessions'], ['sites', 'Sites'], ['warnings', 'Warning history'],
    ] as const).map(([tab, text]) => <a key={tab} href={distributionLink(params, { tab, create: '' })} aria-current={state.tab === tab ? 'page' : undefined}>{text}</a>)}</nav>
    <form className="filters" key={`${state.q}:${state.status}:${state.siteId}:${state.date}`} onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); change({ q: String(data.get('q') || ''), status: String(data.get('status') || ''), siteId: String(data.get('siteId') || ''), date: String(data.get('date') || '') });
    }}>
      <label className="field"><span>Search sites</span><input aria-label="Search sites" name="q" defaultValue={state.q} /></label>
      <label className="field"><span>Monitoring status</span><select aria-label="Monitoring status" name="status" defaultValue={state.status}><option value="">All statuses</option><option value="normal">Normal</option><option value="warning">Warning</option><option value="critical">Critical</option><option value="unavailable">Unavailable</option></select></label>
      <label className="field"><span>Pickup site filter</span><select aria-label="Pickup site filter" name="siteId" defaultValue={state.siteId}><option value="">All pickup sites</option>{siteChoices.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
      <label className="field"><span>Forecast date (Manila)</span><select aria-label="Forecast date (Manila)" name="date" defaultValue={state.date}>{(monitoring.data?.dates || [state.date]).map(day => <option key={day} value={day}>{day}</option>)}</select></label>
      <button type="submit">Apply monitoring filters</button>
    </form>
    {(state.tab !== 'sessions') && <ResourceState resource={monitoring} />}
    {monitoring.data && <p className="hint">{monitoring.data.supplier.name} · Monitoring as of {date(monitoring.data.asOf)} · Refreshes every 30 seconds</p>}
    {state.tab === 'monitoring' && monitoring.data && <MonitoringWorkspace overview={monitoring.data} params={params} change={change} refresh={refresh} />}
    {state.tab === 'sessions' && <><ResourceState resource={sites} /><DistributionSessions sites={siteChoices} create={params.get('create') === '1'} refreshMonitoring={refresh} /></>}
    {state.tab === 'sites' && <><ResourceState resource={sites} /><DistributionSites items={monitoring.data?.sites || []} sites={siteChoices} refresh={refresh} /></>}
    {state.tab === 'warnings' && <MonitoringWarnings key={state.siteId} siteId={state.siteId} day={warningDate} onDateChange={warningDate => change({ warningDate })} />}
    <MonitoringNotifications />
    {user.role === 'admin' && monitoring.data && <TemperatureBandsForm bands={monitoring.data.temperatureBands} refresh={refresh} />}
  </>;
}
