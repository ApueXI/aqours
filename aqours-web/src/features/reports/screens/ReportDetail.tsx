import type { ReportDetail as Detail, StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { ActionForm } from '../../../components/ActionForm';
import { History, Notes } from '../../../components/History';
import { AttachmentViewer } from '../../../components/AttachmentViewer';
import { DetailNavigation } from '../../../components/DetailNavigation';
import { returnLink } from '../../../app/navigation';
import { date, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { ReportContext } from '../components/ReportContext';
import { ReportAssociation, ReportReview } from '../components/ReportReview';

const sections = [
  { id: 'report-conversation', label: 'Customer conversation' },
  { id: 'report-review', label: 'Review' },
  { id: 'report-context', label: 'Customer and location' },
  { id: 'report-association', label: 'Incident association' },
  { id: 'report-photos', label: 'Photos' },
  { id: 'report-notes', label: 'Internal notes' },
  { id: 'report-history', label: 'History' },
];

export function ReportDetail({ id, returnTo }: { id: string; returnTo?: string | null }) {
  const resource = useResource<Detail>(`/staff/reports/${id}`);
  const incidents = useAllRecords<StaffIncident>('/staff/incidents');
  const refs = useReferences();
  const d = resource.data;
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.reference || 'Report detail'}><a href={returnLink(returnTo, 'reports')}>Back to inbox</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <div className="record-strip"><StatusLabel value={d.status} /><p>{label(d.category)}</p><p>{label(d.priority)} priority</p><p>{refs.users.data?.find(user => user.id === d.ownerId)?.name || 'Unassigned'}</p></div>
      <DetailNavigation items={sections} />
      <div className="detail-grid">
        <div>
          <section id="report-conversation" tabIndex={-1}><h2>Acknowledge or ask for clarification</h2>
            <p className="hint">Messages in this conversation are visible to the customer.</p>
            {d.messages.length === 0 && <p>No customer messages yet. Send an acknowledgment or ask for the details needed to investigate.</p>}
            {d.messages.map(message => <article className="conversation-entry" data-author={message.authorRole} key={message.id}><strong>{label(message.authorRole)}</strong> · <time dateTime={message.createdAt}>{date(message.createdAt)}</time><p className="preserve">{message.text}</p></article>)}
            <ActionForm path={`/staff/reports/${id}/messages`} submit="Send to customer" onDone={refresh}
              fields={[{ name: 'text', label: 'Customer-visible message', type: 'textarea', required: true, hint: 'Your first customer-visible message records the first staff response.' }]} />
          </section>
          <ReportContext d={d} zones={refs.zones.data || []} />
          <section id="report-photos" tabIndex={-1}><h2>Protected photos</h2>{d.attachments.length === 0 && <p>No attachments.</p>}{d.attachments.map(attachment => <AttachmentViewer key={attachment.id} attachment={attachment} />)}</section>
          <History id="report-history" events={d.timeline} />
        </div>
        <div>
          <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
          <ReportReview d={d} users={refs.users.data || []} zones={refs.zones.data || []} refresh={refresh} />
          <ResourceState resource={incidents} />
          <ReportAssociation d={d} incidents={incidents.data || []} refresh={refresh} />
          <Notes id="report-notes" path={`/staff/reports/${id}/notes`} notes={d.notes} refresh={refresh} />
        </div>
      </div>
    </div>}</ResourceState>
  </>;
}
