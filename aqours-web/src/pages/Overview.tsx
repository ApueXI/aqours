import { useState } from 'react';
import type { Metrics } from '@aqours/contracts';
import { query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { FilterBar } from '../components/Filters';
import { date, label, PageTitle, ResourceState } from '../components/Status';

function duration(seconds: number | null) {
  if (seconds === null) return 'No completed sample';
  return seconds >= 3600 ? `${(seconds / 3600).toFixed(1)} hours` : `${(seconds / 60).toFixed(1)} minutes`;
}
export function Overview() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const resource = useResource<Metrics>(`/staff/metrics${query(filters)}`);
  const m = resource.data;
  return <><PageTitle title="Overview"><button onClick={() => void resource.refresh()}>Refresh</button></PageTitle>
    <FilterBar values={filters} onChange={setFilters} />
    <ResourceState resource={resource}>{m && <>
      <p>{date(m.from)} – {date(m.to)} · {m.timezone} · As of {date(m.asOf)}</p>
      <p className="hint">{m.cohort}</p>
      <section><h2>Reports and incidents</h2><table><thead><tr><th>Measure</th><th>Count</th><th>Review</th></tr></thead><tbody>
        <tr><td>Active incidents</td><td>{m.activeIncidents}</td><td><a href="#/incidents">Open incidents</a></td></tr>
        <tr><td>Unresolved reports</td><td>{m.unresolvedReports}</td><td><a href={`#/reports${query(filters)}`}>Review inbox</a></td></tr>
        <tr><td>Reports in selected cohort</td><td>{m.reportCount}</td><td><a href={`#/map${query(filters)}`}>View map</a></td></tr>
        <tr><td>Unique reporting connections</td><td>{m.uniqueConnections}</td><td>Separate from estimated affected customers</td></tr>
        <tr><td>Reviewed duplicate / invalid closures</td><td>{m.reviewedClosures}</td><td>Excluded from service resolution durations</td></tr>
        <tr><td>Reports returned for review</td><td>{m.reopenedReports}</td><td>First resolution retained in history</td></tr>
      </tbody></table></section>
      <section><h2>Categories</h2><table><thead><tr><th>Category</th><th>Reports</th></tr></thead><tbody>
        {Object.entries(m.categories).map(([category, count]) => <tr key={category}><td><a href={`#/reports${query({ ...filters, category })}`}>{label(category)}</a></td><td>{count}</td></tr>)}
      </tbody></table></section>
      <section><h2>Response and resolution</h2><table><thead><tr><th>Measurement</th><th>Arithmetic mean</th><th>Completed samples</th><th>Pending / excluded</th></tr></thead><tbody>
        <tr><td>First staff response</td><td>{duration(m.firstResponse.meanSeconds)}</td><td>{m.firstResponse.sampleCount}</td><td>{m.firstResponse.pendingCount} pending</td></tr>
        <tr><td>First substantive resolution</td><td>{duration(m.firstResolution.meanSeconds)}</td><td>{m.firstResolution.sampleCount}</td><td>{m.firstResolution.pendingCount} pending · {m.firstResolution.excludedCount} excluded</td></tr>
      </tbody></table>
        <p className="hint">First response runs from report submission to the first staff message visible to the customer. Automatic receipts, status changes, and internal notes do not count. Pending responses have no duration.</p>
        <p className="hint">First resolution measures the first substantive service resolution. Duplicate and invalid closures are excluded. Historic first resolution remains after a customer reports continued impact.</p>
        <p className="hint">Active incidents have a status other than resolved. Unresolved reports are received, under review, or in progress. Counts can include clearly labeled demonstration records; inspect the source record before using them operationally.</p>
      </section>
    </>}</ResourceState>
  </>;
}
