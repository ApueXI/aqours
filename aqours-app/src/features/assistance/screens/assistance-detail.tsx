import type { AssistanceRequest } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Demo, ErrorNotice, Field, Screen, Section, navigate } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { StatusLabel } from '@/components/status-label';
import { Timeline } from '@/components/timeline';
import { useCommand } from '@/hooks/use-command';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { AssistanceSummary, assistanceNames } from '../components/assistance-summary';

function Cancellation({ request, reload }: { request: AssistanceRequest; reload(): Promise<void> }) {
  const [reason, setReason] = useState('');
  const command = useCommand<AssistanceRequest>();
  async function cancel() {
    if (!reason.trim()) return;
    const result = await command.execute(`/assistance-requests/${request.id}/cancel`, { expectedVersion: request.version, reason: reason.trim() });
    if (result) await reload();
  }
  return <Section title="Cancel request">
    <Body muted>You can cancel before work or collection starts. The supplier checks the current request status again.</Body>
    <Field label="Cancellation reason" value={reason} onChangeText={setReason} multiline maxLength={2000} editable={!command.locked} />
    <ErrorNotice error={command.error} />
    <Button title={command.busy ? 'Cancelling…' : command.uncertain ? 'Retry same cancellation' : 'Confirm cancellation'} secondary disabled={command.busy || !reason.trim()} onPress={() => void cancel()} />
    {command.error && !command.uncertain && <Button title="Refresh current request" secondary onPress={() => void reload()} />}
  </Section>;
}

export function AssistanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<AssistanceRequest>(`/assistance-requests/${id}`);
  const request = resource.data;
  return <Screen title={request?.reference ?? 'Assistance detail'}>
    <ResourceState {...resource} />
    {request && <>
      <Section title={assistanceNames[request.type]}>
        <StatusLabel value={request.status} />
        <Body muted>Requested {displayTime(request.createdAt)}</Body>
        {request.status === 'requested' && <Body>Awaiting supplier review. An appointment or water allocation is not yet confirmed.</Body>}
        <Body>Agreed appointment: {displayTime(request.appointmentAt)}</Body>
        {request.details.preferredWindow && <Body>Requested window: {request.details.preferredWindow}</Body>}
        {request.reason && <Body>Supplier update: {request.reason}</Body>}
        {request.outcome && <Body>Outcome: {request.outcome}</Body>}
        {request.nextSteps && <Body>Next steps: {request.nextSteps}</Body>}
      </Section>
      <AssistanceSummary details={request.details} />
      {request.session && <Section title="Pickup arrangements">
        <Demo visible={request.session.demo || request.session.site.demo} />
        <Body>{request.session.site.name}</Body><Body>{request.session.site.address}</Body>
        <Body>{displayTime(request.session.startsAt)} to {displayTime(request.session.endsAt)}</Body>
        <Body>{request.session.site.instructions}</Body><Body>{request.session.instructions}</Body>
        <Body>Session: {label(request.session.status)}</Body>
      </Section>}
      {request.allocation && <Section title="Water allocation">
        <Body>Pickup reference: {request.allocation.reference}</Body>
        <Body>{request.allocation.liters} liters · {label(request.allocation.state)}</Body>
        {request.allocation.collectedAt && <Body>Collected {displayTime(request.allocation.collectedAt)}</Body>}
        {request.allocation.releasedAt && <Body>Reservation released {displayTime(request.allocation.releasedAt)}</Body>}
      </Section>}
      <Timeline events={request.timeline ?? []} />
      {request.canCancel && <Cancellation request={request} reload={resource.reload} />}
      {request.status === 'unavailable' && <Button title="Request callback/support follow-up" onPress={() => navigate(`/assistance/new?reportId=${request.reportId}&type=callback`)} />}
      <Button title="Open linked report / message the supplier" secondary onPress={() => navigate(`/reports/${request.reportId}`)} />
      <Button title="Refresh request" secondary onPress={() => void resource.reload()} />
    </>}
  </Screen>;
}
