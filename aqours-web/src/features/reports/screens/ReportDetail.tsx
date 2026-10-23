import type { ReportDetail as Detail, StaffIncident } from '@aqours/contracts';
import { useState } from 'react';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { History, Notes } from '../../../components/History';
import { AttachmentViewer } from '../../../components/AttachmentViewer';
import { returnLink } from '../../../app/navigation';
import { label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { ReportContext } from '../components/ReportContext';
import { ReportAssociation, ReportReview } from '../components/ReportReview';
import { ReportConversation } from '../components/ReportConversation';

export function ReportDetail({ id, returnTo, initialView }: { id: string; returnTo?: string | null; initialView?: string | null }) {
  const [view, setView] = useState(initialView === 'messages' ? 'messages' : 'summary');
  const resource = useResource<Detail>(`/staff/reports/${id}`);
  const incidents = useAllRecords<StaffIncident>('/staff/incidents');
  const refs = useReferences();
  const d = resource.data;
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.reference || 'Report detail'}><a href={returnLink(returnTo, 'reports')}>Back to inbox</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={id}>
      <div className="record-strip"><StatusLabel value={d.status} /><p>{label(d.category)}</p><p>{label(d.priority)} priority</p><p>{refs.users.data?.find(user => user.id === d.ownerId)?.name || 'Unassigned'}</p></div>
      <div className="detail-grid">
        <div>
          <nav className="tabs" aria-label="Report views">{['summary', 'messages', 'history'].map(item => <button key={item} type="button" aria-current={view === item ? 'page' : undefined} onClick={() => setView(item)}>{label(item)}{item === 'messages' ? ` (${d.messages.length})` : ''}</button>)}</nav>
          <div hidden={view !== 'messages'}><ReportConversation id={id} messages={d.messages} visible={view === 'messages'} refresh={refresh} /></div>
          <div hidden={view !== 'summary'}>
          <ReportContext d={d} zones={refs.zones.data || []} />
          <section id="report-photos" tabIndex={-1}><h2>Protected photos</h2>{d.attachments.length === 0 && <p>No attachments.</p>}{d.attachments.map(attachment => <AttachmentViewer key={attachment.id} attachment={attachment} />)}</section>
          <button type="button" className="primary" onClick={() => setView('messages')}>Message customer</button></div>
          <div hidden={view !== 'history'}><History id="report-history" events={d.timeline} /></div>
        </div>
        <div>
          <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
          <div>
          <ReportReview d={d} users={refs.users.data || []} zones={refs.zones.data || []}
            referencesLoading={refs.users.loading || refs.zones.loading || refs.users.data === undefined || refs.zones.data === undefined} refresh={refresh} />
          <ResourceState resource={incidents} />
          <ReportAssociation d={d} incidents={incidents.data || []} incidentsLoading={incidents.loading || incidents.data === undefined} refresh={refresh} />
          </div>
          <Notes id="report-notes" path={`/staff/reports/${id}/notes`} notes={d.notes} refresh={refresh} />
        </div>
      </div>
    </div>}</ResourceState>
  </>;
}
