import type { Metrics } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useResource } from '../../../hooks/useResource';
import { useQueueFilters } from '../../../hooks/useQueueFilters';
import { FilterBar } from '../../../components/Filters';
import { date, label, PageTitle, ResourceState } from '../../../components/Status';
import { OperationalQueues } from '../components/OperationalQueues';

function duration(seconds: number | null) {
  if (seconds === null) return 'No completed sample';
  return seconds >= 3600 ? `${(seconds / 3600).toFixed(1)} hours` : `${(seconds / 60).toFixed(1)} minutes`;
}
export function Overview({ params }: { params: URLSearchParams }) {
  const { filters, setFilters } = useQueueFilters('overview', params);
  const resource = useResource<Metrics>(`/staff/metrics${query(filters)}`);
  const m = resource.data;
  return <><PageTitle title="Overview"><button onClick={() => void resource.refresh()}>Refresh</button></PageTitle>
    <p className="page-description">Review outstanding reports and service activity, then open the next item that needs attention.</p>
    <FilterBar values={filters} onChange={setFilters} />
    <ResourceState resource={resource}>{m && <>
      <p>{date(m.from)} – {date(m.to)} · {m.timezone} · As of {date(m.asOf)}</p>
      <p className="hint">{m.cohort}</p>
      <div className="task-summary" aria-label="Service work queues">
        <a href={`#/reports${query(filters)}`}><strong>{m.unresolvedReports}</strong><span>Unresolved reports</span><span>Review inbox →</span></a>
        <a href="#/incidents"><strong>{m.activeIncidents}</strong><span>Active incidents</span><span>Open incidents →</span></a>
        <a href={`#/map${query(filters)}`}><strong>{m.reportCount}</strong><span>Reports in this cohort</span><span>Locate reports →</span></a>
      </div>
      <OperationalQueues />
      <details><summary>Report measures and cohort definitions</summary><section><h2>Reports and incidents</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Report and incident measures"><table><thead><tr><th>Measure</th><th className="numeric">Count</th><th>Review</th></tr></thead><tbody>
        <tr><td>Active incidents</td><td className="numeric">{m.activeIncidents}</td><td><a href="#/incidents">Open incidents</a></td></tr>
        <tr><td>Unresolved reports</td><td className="numeric">{m.unresolvedReports}</td><td><a href={`#/reports${query(filters)}`}>Review inbox</a></td></tr>
        <tr><td>Reports in selected cohort</td><td className="numeric">{m.reportCount}</td><td><a href={`#/map${query(filters)}`}>View map</a></td></tr>
        <tr><td>Unique reporting connections</td><td className="numeric">{m.uniqueConnections}</td><td>Separate from estimated affected customers</td></tr>
        <tr><td>Reviewed duplicate / invalid closures</td><td className="numeric">{m.reviewedClosures}</td><td>Excluded from service resolution durations</td></tr>
        <tr><td>Reports returned for review</td><td className="numeric">{m.reopenedReports}</td><td>First resolution retained in history</td></tr>
      </tbody></table></div></section></details>
      <div className="overview-metrics">
      <section><h2>Categories</h2><table><thead><tr><th>Category</th><th className="numeric">Reports</th></tr></thead><tbody>
        {Object.entries(m.categories).map(([category, count]) => <tr key={category}><td><a href={`#/reports${query({ ...filters, category })}`}>{label(category)}</a></td><td className="numeric">{count}</td></tr>)}
      </tbody></table></section>
      <section><h2>Response and resolution</h2><div className="table-scroll" tabIndex={0} role="region" aria-label="Response and resolution measures"><table><thead><tr><th>Measurement</th><th className="numeric">Arithmetic mean</th><th className="numeric">Completed samples</th><th className="numeric">Pending / excluded</th></tr></thead><tbody>
        <tr><td>First staff response</td><td className="numeric">{duration(m.firstResponse.meanSeconds)}</td><td className="numeric">{m.firstResponse.sampleCount}</td><td className="numeric">{m.firstResponse.pendingCount} pending</td></tr>
        <tr><td>First substantive resolution</td><td className="numeric">{duration(m.firstResolution.meanSeconds)}</td><td className="numeric">{m.firstResolution.sampleCount}</td><td className="numeric">{m.firstResolution.pendingCount} pending · {m.firstResolution.excludedCount} excluded</td></tr>
      </tbody></table></div>
        <p className="hint">First response runs from report submission to the first staff message visible to the customer. Automatic receipts, status changes, and internal notes do not count. Pending responses have no duration.</p>
        <p className="hint">First resolution measures the first substantive service resolution. Duplicate and invalid closures are excluded. Historic first resolution remains after a customer reports continued impact.</p>
        <p className="hint">Active incidents have a status other than resolved. Unresolved reports are received, under review, or in progress. Counts can include clearly labeled demonstration records; inspect the source record before using them operationally.</p>
      </section></div>
    </>}</ResourceState>
  </>;
}
