import type { AssistanceRequest, ReportDetail } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { AssistanceActions } from '../components/AssistanceActions';
import { History, Notes } from '../../../components/History';
import { date, Demo, label, PageTitle, ResourceState } from '../../../components/Status';

export function AssistanceDetail({ id }: { id: string }) {
  const resource = useResource<AssistanceRequest>(`/staff/assistance-requests/${id}`);
  const refs = useReferences();
  const d = resource.data;
  const report = useResource<ReportDetail>(d ? `/staff/reports/${d.reportId}` : null);
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.reference || 'Assistance detail'}><a href="#/assistance">Back to queue</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <section><h2>{label(d.type)} · {label(d.status)}</h2><dl className="facts grid [grid-template-columns:minmax(150px,_1fr)_minmax(0,_3fr)] gap-y-[12px] gap-x-[20px] [margin:0_0_20px] [&_dt]:font-[550] [&_dt]:text-[#475569] [&_dd]:m-[0] [&_dd]:[overflow-wrap:anywhere] [@media(max-width:_1100px)]:[grid-template-columns:minmax(120px,_1fr)_minmax(0,_2fr)] [@media(max-width:_760px)]:block [@media(max-width:_760px)]:[&_dt]:mt-[12px] [@media(max-width:_760px)]:[&_dd]:mt-[4px]">
        <dt>Linked report</dt><dd><a href={`#/reports/${d.reportId}`}>Review customer report and connection</a></dd>
        <dt>Customer</dt><dd>{report.data?.customer?.name || 'See linked report'} · {report.data?.customer?.phone || report.data?.customer?.email || 'No contact loaded'}</dd>
        <dt>Connection reference</dt><dd>{report.data?.customer?.connectionReference || 'See linked report'}</dd>
        <dt>Incident context</dt><dd>{d.incidentId ? <a href={`#/incidents/${d.incidentId}`}>Open incident</a> : 'No incident link'}</dd>
        <dt>Requested</dt><dd>{date(d.createdAt)}</dd><dt>Agreed appointment</dt><dd>{date(d.appointmentAt)}</dd>
        <dt>Owner</dt><dd>{refs.users.data?.find(user => user.id === d.ownerId)?.name || 'Unassigned'}</dd>
        {Object.entries(d.details).filter(([, value]) => value !== null && value !== '').map(([key, value]) => <div className="fact-pair contents" key={key}><dt>{label(key.replace(/([A-Z])/g, ' $1'))}</dt><dd>{key === 'sessionId' ? d.session?.site.name || 'Selected session' : String(value)}</dd></div>)}
        <dt>Outcome</dt><dd className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{d.outcome || 'Not recorded'}</dd><dt>Next steps</dt><dd className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{d.nextSteps || 'Not recorded'}</dd>
        <dt>Change reason</dt><dd>{d.reason || 'Not recorded'}</dd>
      </dl><ResourceState resource={report} /><p className="hint text-[#475569] text-[13px]">Completing assistance does not resolve the report or incident or lift a quality restriction.</p></section>
      {d.session && <section><h2>Pickup session and allocation</h2><Demo value={d.session.demo} /><p>{d.session.site.name} · {d.session.site.address}</p>
        <p>{date(d.session.startsAt)} – {date(d.session.endsAt)} · {label(d.session.status)}</p><p className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{d.session.instructions}</p>
        <p>Current stock: {d.session.totalLiters} L total · {d.session.reservedLiters} L reserved · {d.session.collectedLiters} L collected · {d.session.remainingLiters} L remaining</p>
        {d.allocation ? <p>Pickup reference: <strong>{d.allocation.reference}</strong> · {d.allocation.liters} L · {label(d.allocation.state)}</p> : <p>No liters reserved. The request has not been accepted.</p>}
      </section>}
      <ResourceState resource={refs.users} /><AssistanceActions d={d} users={refs.users.data || []} refresh={refresh} />
      <Notes path={`/staff/assistance-requests/${id}/notes`} notes={d.notes} refresh={refresh} /><History events={d.timeline} />
    </div>}</ResourceState>
  </>;
}
