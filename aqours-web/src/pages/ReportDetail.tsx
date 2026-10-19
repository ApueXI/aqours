import type { ReportDetail as Detail, StaffIncident } from '@aqours/contracts';
import { useResource } from '../hooks/useResource';
import { useReferences } from '../hooks/useReferences';
import { useAllRecords } from '../hooks/useAllRecords';
import { ActionForm } from '../components/ActionForm';
import { options, ownerOptions, reportStatuses, zoneOptions } from '../components/Filters';
import { History, Notes } from '../components/History';
import { AttachmentViewer } from '../components/AttachmentViewer';
import { returnLink } from '../components/navigation';
import { date, label, PageTitle, ResourceState } from '../components/Status';

export function ReportDetail({ id, returnTo }: { id: string; returnTo?: string | null }) {
  const resource = useResource<Detail>(`/staff/reports/${id}`);
  const incidents = useAllRecords<StaffIncident>('/staff/incidents');
  const refs = useReferences();
  const d = resource.data;
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.reference || 'Report detail'}><a href={returnLink(returnTo, 'reports')}>Back to inbox</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <section><h2>{label(d.category)} · {label(d.status)}</h2><p className="preserve">{d.description}</p>
        {d.guidedDetails && <p className="preserve">Additional issue details: {d.guidedDetails}</p>}
        <dl className="facts"><dt>Submitted</dt><dd>{date(d.submittedAt)}</dd><dt>Noticed</dt><dd>{date(d.noticedAt)}</dd>
          <dt>Customer</dt><dd>{d.customer?.name} · {d.customer?.email} · {d.customer?.phone || 'No phone'}</dd>
          <dt>Service connection</dt><dd>{d.customer?.connectionReference} · {d.customer?.savedAddress}</dd>
          <dt>Issue address snapshot</dt><dd>{d.address}</dd>
          <dt>Location provenance</dt><dd>{label(d.locationSource)} · {d.locationConfirmed ? 'Confirmed' : 'Unconfirmed'} · {d.latitude === null ? 'No coordinates' : `${d.latitude}, ${d.longitude}`}</dd>
          {d.accuracy !== null && <><dt>GPS reported accuracy</dt><dd>Approximately {Math.round(d.accuracy)} meters</dd></>}
          <dt>Zone review</dt><dd>{refs.zones.data?.find(zone => zone.id === d.zoneId)?.name || 'Unknown zone'} · {d.zoneConfirmed ? 'Reviewed' : 'Confirmation required'}{d.locationReview ? ' · Location review needed' : ''}</dd>
          <dt>Priority</dt><dd>{label(d.priority)} · {d.priorityReason || 'No priority reason recorded'}</dd>
          <dt>First response</dt><dd>{date(d.firstRespondedAt)}</dd><dt>First substantive resolution</dt><dd>{date(d.firstResolvedAt)}</dd>
          {d.closureOutcome && <><dt>Closure outcome</dt><dd>{label(d.closureOutcome)} · {d.closureReason}</dd></>}
        </dl>
      </section>
      <div className="columns"><section><h2>Acknowledge or ask for clarification</h2>
        {d.messages.map(message => <article className="entry" key={message.id}><strong>{label(message.authorRole)}</strong> · {date(message.createdAt)}<p className="preserve">{message.text}</p></article>)}
        <ActionForm path={`/staff/reports/${id}/messages`} submit="Send to customer" onDone={refresh}
          fields={[{ name: 'text', label: 'Customer-visible message', type: 'textarea', required: true, hint: 'Your first customer-visible message records the first staff response.' }]} />
      </section><section><h2>Review report</h2>
        <ActionForm path={`/staff/reports/${id}`} method="PATCH" version={d.version} submit="Save review" onDone={refresh} fields={[
          { name: 'status', label: 'Status', type: 'select', value: d.status, required: true, options: options(reportStatuses) },
          { name: 'ownerId', label: 'Assigned owner', type: 'select', value: d.ownerId, nullable: true, options: ownerOptions(refs.users.data) },
          { name: 'priority', label: 'Priority', type: 'select', value: d.priority, required: true, options: options(['normal', 'high', 'urgent']) },
          { name: 'closureOutcome', label: 'Closure outcome (only when resolving)', type: 'select', omitEmpty: true, options: options(['restored', 'duplicate', 'invalid']) },
          { name: 'zoneId', label: 'Reviewed issue zone', type: 'select', value: d.zoneId, nullable: true, options: zoneOptions(refs.zones.data) },
          { name: 'zoneConfirmed', label: 'I reviewed the issue zone association', type: 'checkbox', value: d.zoneConfirmed },
          { name: 'reason', label: 'Review / priority / closure reason', type: 'textarea', required: true },
        ]} />
      </section></div>
      <section><h2>Incident association</h2>
        <p>{d.incidentId ? <a href={`#/incidents/${d.incidentId}`}>Open currently linked incident</a> : 'This report is not linked to an incident.'}</p>
        {d.suggestions?.map(suggestion => <p key={suggestion.id}>Suggested: <a href={`#/incidents/${suggestion.id}`}>{suggestion.summary}</a> · {suggestion.reason}</p>)}
        <ResourceState resource={incidents} />
        <ActionForm path={`/staff/reports/${id}/link`} version={d.version} submit="Confirm association" onDone={refresh} fields={[
          { name: 'incidentId', label: 'Incident (choose none to unlink)', type: 'select', value: d.incidentId, nullable: true, options: incidents.data?.map(incident => ({ value: incident.id, label: `${incident.summary} · ${label(incident.status)}` })) },
          { name: 'reason', label: 'Reason for link / correction', type: 'textarea', required: true },
        ]} />
      </section>
      <section><h2>Protected photos</h2>{d.attachments.length === 0 && <p>No attachments.</p>}{d.attachments.map(attachment => <AttachmentViewer key={attachment.id} attachment={attachment} />)}</section>
      <Notes path={`/staff/reports/${id}/notes`} notes={d.notes} refresh={refresh} /><History events={d.timeline} />
    </div>}</ResourceState>
  </>;
}
