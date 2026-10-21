import type { Connection, PublishedIncident, Report } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Demo, ErrorNotice, Screen, Section, navigate } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { StatusLabel } from '@/components/status-label';
import { IncidentUpdates } from '@/components/timeline';
import { useResource } from '@/hooks/use-resource';
import { useCommand } from '@/hooks/use-command';

export function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const incident = useResource<PublishedIncident>(`/incidents/${id}`, true);
  const connections = useResource<Connection[]>('/me/connections');
  const [selected, setSelected] = useState<string | null>(null);
  const affected = useCommand<Report>();
  const connectionId = selected ?? connections.data?.[0]?.id;
  async function markAffected() {
    if (!connectionId) return;
    const report = await affected.execute(`/incidents/${id}/affected`, { connectionId });
    if (report) navigate(`/reports/${report.id}`);
  }
  return <Screen title="Published incident">
    <ResourceState {...incident} />
    {incident.data && <>
      <Demo visible={incident.data.demo} /><StatusLabel value={incident.data.status} /><Body>{incident.data.summary}</Body>
      <IncidentUpdates updates={incident.data.updates} />
      <Section title="Is your connection affected?">
        <Body muted>This records your own affected report. Repeating this action reuses your existing report for this incident and connection.</Body>
        <ResourceState {...connections} empty={connections.data?.length === 0 && 'A saved connection is required. Contact the supplier.'} />
        {connections.data?.map((connection) => <Button key={connection.id} title={`${connection.reference} · ${connection.address}`} secondary
          selected={connectionId === connection.id} disabled={affected.locked} onPress={() => setSelected(connection.id)} />)}
        <ErrorNotice error={affected.error} />
        {affected.uncertain && <Body>Confirmation is pending. Retry the same affected assertion.</Body>}
        <Button title={affected.busy ? 'Confirming…' : affected.uncertain ? 'Retry affected confirmation' : 'Mark my connection affected'} disabled={!connectionId || affected.busy} onPress={() => void markAffected()} />
      </Section>
    </>}
  </Screen>;
}
