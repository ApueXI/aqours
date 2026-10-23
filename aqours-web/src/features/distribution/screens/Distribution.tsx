import { FilterDialog } from '../../../components/FilterDialog';
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
  return <div className="operations-page distribution-page"><PageTitle title="Water distribution">
    <RefreshForecasts items={monitoring.data?.sites || []} refresh={refresh} />
    <button className="primary" onClick={() => change({ tab: 'sessions', create: '1' })}>New pickup session</button>
  </PageTitle>
    <p className="page-description">Monitor pickup-site supply, manage sessions and find customer reservations.</p>
    <nav className="tabs" aria-label="Distribution sections">{([
      ['monitoring', 'Monitoring'], ['sessions', 'Pickup sessions'], ['sites', 'Pickup sites'], ['warnings', 'Warning history'],
    ] as const).map(([tab, text]) => <a key={tab} href={distributionLink(params, { tab, create: '' })} aria-current={state.tab === tab ? 'page' : undefined}>{text}</a>)}</nav>
    <div className="distribution-tools"><ReservationLookup />
    <details className="distribution-help"><summary>How water pickup works</summary>
      <ol>
        <li><a href={distributionLink(params, { tab: 'sites', create: '' })}>Set up a pickup site</a> with an address and collection instructions.</li>
        <li><a href={distributionLink(params, { tab: 'sessions', create: '' })}>Create a pickup session</a>: choose the site, service zones, collection times and available liters.</li>
        <li><a href="#/assistance?type=water_support">Review water-support requests</a>. Accept a request to reserve stock, then arrange collection.</li>
        <li>Use the reservation lookup when the customer arrives. Record collection to deduct the reserved quantity.</li>
      </ol>
      <details><summary>What does monitoring do?</summary><p>Monitoring compares pickup-site stock and forecasts with configured thresholds. It helps staff spot possible shortages or heat warnings. It does not reserve water, create sessions or confirm customer requests.</p></details>
    </details>
    </div>
    {(state.tab === 'monitoring' || state.tab === 'warnings') && <FilterDialog
      values={{ q: state.q, status: state.status, siteId: state.siteId }}
      onChange={values => change({ q: values.q || '', status: values.status || '', siteId: values.siteId || '' })}
      fields={[
        { name: 'q', label: 'Search sites' },
        { name: 'status', label: 'Monitoring status', type: 'select', options: ['normal', 'warning', 'critical', 'unavailable'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })) },
        { name: 'siteId', label: 'Pickup site filter', type: 'select', options: siteChoices.map(site => ({ value: site.id, label: site.name })) },
      ]} />}
    {(state.tab !== 'sessions') && <ResourceState resource={monitoring} />}
    {monitoring.data && <p className="hint">{monitoring.data.supplier.name} · Monitoring as of {date(monitoring.data.asOf)} · Refreshes every 30 seconds</p>}
    {state.tab === 'monitoring' && monitoring.data && <MonitoringWorkspace overview={monitoring.data} params={params} change={change} refresh={refresh} />}
    {state.tab === 'sessions' && <><ResourceState resource={sites} /><DistributionSessions sites={siteChoices} sitesLoading={sites.loading} create={params.get('create') === '1'} refreshMonitoring={refresh} onCreateClose={() => change({ create: '' })} /></>}
    {state.tab === 'sites' && <><ResourceState resource={sites} /><DistributionSites items={monitoring.data?.sites || []} sites={siteChoices} refresh={refresh} /></>}
    {state.tab === 'warnings' && <MonitoringWarnings key={state.siteId} siteId={state.siteId} day={warningDate} onDateChange={warningDate => change({ warningDate })} />}
    <MonitoringNotifications />
    {user.role === 'admin' && monitoring.data && <TemperatureBandsForm bands={monitoring.data.temperatureBands} refresh={refresh} />}
  </div>;
}
