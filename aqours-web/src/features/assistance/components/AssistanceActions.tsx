import { useState } from 'react';
import type { AssistanceRequest, User } from '@aqours/contracts';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { ownerOptions } from '../../../components/Filters';
import { label } from '../../../components/Status';

export function transitionTargets(d: AssistanceRequest): string[] {
  const targets: Record<string, string[]> = {
    requested: ['accepted', 'cancelled', 'unavailable'],
    accepted: ['scheduled', 'in_progress', 'cancelled', 'unavailable'],
    scheduled: ['scheduled', 'in_progress', 'cancelled', 'unavailable'],
    in_progress: ['completed', 'scheduled', 'unavailable'],
  };
  return (targets[d.status] || []).filter(status => status !== 'completed' || d.type !== 'water_support');
}
export function AssistanceActions({ d, users, refresh }: { d: AssistanceRequest; users: User[]; refresh: () => void }) {
  const targets = transitionTargets(d);
  const [target, setTarget] = useState(targets[0] || '');
  const reasonRequired = ['cancelled', 'unavailable'].includes(target) ||
    (target === 'scheduled' && ['scheduled', 'in_progress'].includes(d.status)) ||
    (target === 'in_progress' && d.status === 'accepted');
  const fields: Field[] = [
    { name: 'ownerId', label: 'Assigned staff owner', type: 'select', value: d.ownerId, required: !['cancelled', 'unavailable'].includes(target), omitEmpty: true, options: ownerOptions(users) },
    ...(target === 'scheduled' ? [{ name: 'appointmentAt', label: 'Agreed appointment / pickup time (Manila)', type: 'datetime-local' as const, value: d.appointmentAt, required: true }] : []),
    { name: 'reason', label: reasonRequired ? 'Required change / immediate-support reason' : 'Change reason (optional)', type: 'textarea', required: reasonRequired, omitEmpty: true },
    { name: 'outcome', label: d.type === 'inspection' ? 'Inspection findings / outcome' : 'Contact / service outcome', type: 'textarea', required: target === 'completed', omitEmpty: true },
    { name: 'nextSteps', label: 'Customer next steps', type: 'textarea', required: target === 'completed', omitEmpty: true },
  ];
  return <>
    {targets.length > 0 && <section><h2>Update assistance</h2>
      <label className="field flex flex-col gap-[6px] mb-[16px] max-w-[640px] [&_>_span:first-child]:font-[550]"><span>Next status</span><select aria-label="Next status" value={target} onChange={event => setTarget(event.target.value)}>
        {targets.map(value => <option key={value} value={value}>{value === d.status ? 'Reschedule appointment' : label(value)}</option>)}
      </select></label>
      {target === 'accepted' && d.type === 'water_support' && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Acceptance reserves the requested liters against current session stock. Full or cancelled sessions can be rejected by the server.</p>}
      <ActionForm key={target} path={`/staff/assistance-requests/${d.id}/transition`} version={d.version} fields={fields}
        extra={{ status: target }} submit={target === d.status ? 'Record reschedule' : `Mark ${label(target).toLowerCase()}`} onDone={refresh} />
    </section>}
    {d.type === 'water_support' && d.allocation?.state === 'reserved' && ['accepted', 'scheduled', 'in_progress'].includes(d.status) && <section>
      <h2>Confirm water collection</h2><p>Verify pickup reference <strong>{d.allocation.reference}</strong> with the customer. Reserved quantity: {d.allocation.liters} liters.</p>
      <ActionForm path={`/staff/water-allocations/${d.allocation.id}/collect`} version={d.version} submit="Record collection" onDone={refresh} fields={[
        { name: 'reason', label: 'Immediate collection reason', type: 'textarea', required: d.status === 'accepted', omitEmpty: true },
        { name: 'outcome', label: 'Collection outcome', type: 'textarea', required: true },
        { name: 'nextSteps', label: 'Customer next steps', type: 'textarea', required: true },
      ]} preview={body => <><h3>Confirm collection of {d.allocation?.liters} liters</h3><p>Pickup reference: {d.allocation?.reference}</p><p>{String(body.outcome)}</p><p>{String(body.nextSteps)}</p><p>This records one collection and completes this assistance request.</p></>} />
    </section>}
  </>;
}
