import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import type { ConversationSummary } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { Pagination } from '../../../components/Pagination';

export function Messages() {
  const [offset, setOffset] = useState(0);
  const resource = useResource<ConversationSummary[]>(`/staff/messages?offset=${offset}`);
  useEffect(() => { const timer = window.setInterval(() => void resource.refresh(), 30000); return () => window.clearInterval(timer); }, [resource.refresh]);
  return <><PageTitle title="Messages"><button onClick={() => void resource.refresh()}><FiRefreshCw aria-hidden="true" />Refresh messages</button></PageTitle>
    <p className="page-description">Customer conversations, with the latest message from each report.</p>
    <ResourceState resource={resource}>{resource.data && <>
      <div className="queue-heading"><p><FiMessageSquare aria-hidden="true" />{resource.result?.page?.total ?? resource.data.length} conversations · Updates every 30 seconds</p></div>
      {resource.data.length === 0 ? <EmptyState title="No customer conversations yet"><p>Conversations will appear here when customers submit reports.</p></EmptyState> :
        <div className="table-scroll data-table" tabIndex={0} role="region" aria-label="Customer conversations"><table className="messages-table">
          <thead><tr><th>Report</th><th>Latest message</th><th>Status</th><th>Last activity</th><th className="action-column">Actions</th></tr></thead>
          <tbody>{resource.data.map(item => <tr key={item.reportId}>
            <th scope="row"><span className="report-reference">{item.reference}</span><div className="cell-secondary">{label(item.category)}</div></th>
            <td><span className="message-author">{item.latestMessage ? item.latestMessage.authorRole === 'customer' ? 'Customer' : 'Supplier' : 'Report description'}</span><p className="message-preview">{item.latestMessage?.text || item.description}</p>{!item.latestMessage && <span className="hint">No messages yet</span>}</td>
            <td><StatusLabel value={item.status} /></td><td className="activity-date">{date(item.updatedAt)}</td>
            <td><a className="row-action" aria-label={`Open conversation for ${item.reference}`} href={`#/reports/${encodeURIComponent(item.reportId)}?view=messages&returnTo=/messages`}>Open<FiArrowUpRight aria-hidden="true" /></a></td>
          </tr>)}</tbody>
        </table></div>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
  </>;
}
