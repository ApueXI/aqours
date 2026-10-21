import type { ReportDetail, Zone } from '@aqours/contracts';
import { date, label } from '../../../components/Status';
import { query } from '../../../services/http-client';

export function ReportContext({ d, zones }: { d: ReportDetail; zones: Zone[] }) {
  return <section id="report-context" tabIndex={-1}><h2>{label(d.category)} · {label(d.status)}</h2>
    <p className="preserve">{d.description}</p>
    {d.guidedDetails && <p className="preserve">Additional issue details: {d.guidedDetails}</p>}
    <dl className="facts">
      <dt>Submitted</dt><dd>{date(d.submittedAt)}</dd><dt>Noticed</dt><dd>{date(d.noticedAt)}</dd>
      <dt>Customer</dt><dd>{d.customer?.name} · {d.customer?.email} · {d.customer?.phone || 'No phone'}</dd>
      <dt>Service connection</dt><dd>{d.customer?.connectionReference} · {d.customer?.savedAddress}</dd>
      <dt>Issue address snapshot</dt><dd>{d.address}</dd>
      <dt>Location provenance</dt><dd>{label(d.locationSource)} · {d.locationConfirmed ? 'Confirmed' : 'Unconfirmed'} · {d.latitude === null ? 'No coordinates' : `${d.latitude}, ${d.longitude}`}</dd>
      {d.accuracy !== null && <><dt>GPS reported accuracy</dt><dd>Approximately {Math.round(d.accuracy)} meters</dd></>}
      <dt>Zone review</dt><dd>{zones.find(zone => zone.id === d.zoneId)?.name || 'Unknown zone'} · {d.zoneConfirmed ? 'Reviewed' : 'Confirmation required'}{d.locationReview ? ' · Location review needed' : ''}</dd>
      <dt>Priority</dt><dd>{label(d.priority)} · {d.priorityReason || 'No priority reason recorded'}</dd>
      <dt>First response</dt><dd>{date(d.firstRespondedAt)}</dd><dt>First substantive resolution</dt><dd>{date(d.firstResolvedAt)}</dd>
      {d.closureOutcome && <><dt>Closure outcome</dt><dd>{label(d.closureOutcome)} · {d.closureReason}</dd></>}
    </dl>
    <a href={`#/map${query({ selected: d.id, view: d.latitude === null ? 'list' : 'map' })}`}>View issue location on map</a>
  </section>;
}
