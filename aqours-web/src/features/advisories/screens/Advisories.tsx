import { FiRefreshCw } from 'react-icons/fi';
import { OperationsTable } from '../../../components/OperationsTable';
import { useState } from 'react';
import type { Advisory, Connection, User } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { AdvisoryEditor } from '../components/AdvisoryEditor';
import { AdvisoryDetail } from '../components/AdvisoryDetail';
import { Pagination } from '../../../components/Pagination';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

export function Advisories({ user, id }: { user: User; id?: string }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Advisory[]>(`/staff/advisories?offset=${offset}`);
  const detail = useResource<Advisory>(id ? `/staff/advisories/${id}` : null);
  const refs = useReferences();
  const connections = useAllRecords<Connection>(user.role === 'admin' ? '/staff/connections' : null);
  const refresh = () => { void resource.refresh(); void detail.refresh(); };
  const d = detail.data;
  return <div className="operations-page"><PageTitle title={id ? d?.title || 'Advisory detail' : 'Official advisories'}>
    {id && <a href="#/advisories">Back to advisories</a>}<button onClick={refresh}><FiRefreshCw aria-hidden="true" />Refresh</button>
    {!id && user.role === 'admin' && <FormDialog title="Create advisory draft" triggerLabel="New advisory" triggerClassName="primary"
      triggerDisabled={refs.zones.loading || connections.loading || refs.zones.data === undefined || connections.data === undefined}>
      <AdvisoryEditor zones={refs.zones.data || []} connections={connections.data || []} refresh={refresh} />
    </FormDialog>}
  </PageTitle><p className="page-description">Manage official notices and safety restrictions independently of incident progress.</p>
    {id ? <><ResourceState resource={refs.zones} />{user.role === 'admin' && <ResourceState resource={connections} />}
      <ResourceState resource={detail}>{d && <AdvisoryDetail d={d} user={user} zones={refs.zones.data || []} connections={connections.data || []} referencesLoading={
        refs.zones.loading || connections.loading || refs.zones.data === undefined || connections.data === undefined} refresh={refresh} />}</ResourceState></> : <>
      {user.role === 'admin' && <><ResourceState resource={refs.zones} /><ResourceState resource={connections} /></>}
      <ResourceState resource={resource}>{resource.data && <><div className="operations-list-heading"><h2>Advisory register</h2><span>{resource.result?.page?.total ?? resource.data.length} advisories</span></div><OperationsTable label="Official advisory records"><table className="advisory-queue-table"><thead><tr><th>Advisory</th><th>Type</th><th>State</th><th>Updated</th></tr></thead><tbody>
        {resource.data.map(item => <tr key={item.id}><th scope="row"><a href={`#/advisories/${item.id}`}>{item.title}</a>{item.demo && <div className="cell-secondary warning-text">Demonstration</div>}</th><td data-label="Type">{label(item.kind)}</td><td data-label="State"><StatusLabel value={item.state} /></td><td className="operations-date" data-label="Updated">{date(item.updatedAt)}</td></tr>)}
      </tbody></table></OperationsTable>{resource.data.length === 0 && <EmptyState title="No advisories."><p>Published service notices will appear here. Administrators can prepare a draft before publication.</p></EmptyState>}<Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} /></>}</ResourceState>
    </>}
    {user.role !== 'admin' && <p className="hint">Staff can read advisories. An administrator manages publication, revisions, and lifting.</p>}
  </div>;
}
