import type { ReportDetail, StaffIncident, User, Zone } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { options, ownerOptions, reportStatuses, zoneOptions } from '../../../components/Filters';
import { label } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

export function ReportReview({ d, users, zones, referencesLoading, refresh }: {
  d: ReportDetail; users: User[]; zones: Zone[]; referencesLoading: boolean; refresh(): void;
}) {
  return <FormDialog title="Review report" triggerLabel="Review report" triggerDisabled={referencesLoading}><p className="hint">Record the next status, owner, and reason. Review duplicate or invalid closures separately from restored service.</p>
    <ActionForm path={`/staff/reports/${d.id}`} method="PATCH" version={d.version} submit="Save review" onDone={refresh} fields={[
      { name: 'status', label: 'Status', type: 'select', value: d.status, required: true, options: options(reportStatuses) },
      { name: 'ownerId', label: 'Assigned owner', type: 'select', value: d.ownerId, nullable: true, options: ownerOptions(users) },
      { name: 'priority', label: 'Priority', type: 'select', value: d.priority, required: true, options: options(['normal', 'high', 'urgent']) },
      { name: 'closureOutcome', label: 'Closure outcome (only when resolving)', type: 'select', omitEmpty: true, options: options(['restored', 'duplicate', 'invalid']) },
      { name: 'zoneId', label: 'Reviewed issue zone', type: 'select', value: d.zoneId, nullable: true, options: zoneOptions(zones) },
      { name: 'zoneConfirmed', label: 'I reviewed the issue zone association', type: 'checkbox', value: d.zoneConfirmed },
      { name: 'reason', label: 'Review / priority / closure reason', type: 'textarea', required: true },
    ]} />
  </FormDialog>;
}

export function ReportAssociation({ d, incidents, incidentsLoading, refresh }: {
  d: ReportDetail; incidents: StaffIncident[]; incidentsLoading: boolean; refresh(): void;
}) {
  return <section><h2>Incident association</h2>
    <p>{d.incidentId ? <a href={`#/incidents/${d.incidentId}`}>Open currently linked incident</a> : 'This report is not linked to an incident.'}</p>
    {d.suggestions?.map(suggestion => <p key={suggestion.id}>Suggested: <a href={`#/incidents/${suggestion.id}`}>{suggestion.summary}</a> · {suggestion.reason}</p>)}
    <FormDialog title="Incident association" triggerLabel="Manage incident association" triggerDisabled={incidentsLoading}><ActionForm path={`/staff/reports/${d.id}/link`} version={d.version} submit="Confirm association" onDone={refresh} fields={[
      { name: 'incidentId', label: 'Incident (choose none to unlink)', type: 'select', value: d.incidentId, nullable: true, options: incidents.map(incident => ({ value: incident.id, label: `${incident.summary} · ${label(incident.status)}` })) },
      { name: 'reason', label: 'Reason for link / correction', type: 'textarea', required: true },
    ]} /></FormDialog>
  </section>;
}
