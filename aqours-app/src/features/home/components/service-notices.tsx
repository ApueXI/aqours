import { advisoryPhase } from '../utils/notice-context';
import { useState } from 'react';
import type { Advisory, Connection, PublishedIncident } from '@aqours/contracts';
import { View } from 'react-native';
import { Body, Button, Demo, Section, navigate, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { StatusLabel } from '@/components/status-label';
import { useAllResources } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { AdvisoryContext } from './advisory-context';

export function ServiceNotices({ notices, connections, verified, restrictions, history = false }: { notices: ReturnType<typeof useAllResources<Advisory>>; connections: Connection[] | null; verified: boolean; restrictions: boolean; history?: boolean }) {
  const quality = (notice: Advisory) => ['boil_water', 'do_not_drink', 'do_not_use'].includes(notice.kind);
  const ordered = notices.data?.filter(notice => {
    const phase = advisoryPhase(notice);
    return quality(notice) === restrictions && phase !== 'draft' && (history || phase === 'current' || phase === 'upcoming');
  }) ?? [];
  return <Section title={restrictions ? 'Water-quality restrictions' : 'Service advisories'}>
    <ResourceState {...notices} empty={notices.data !== null && ordered.length === 0 && (restrictions ? 'No matching published quality restrictions. This does not establish water safety or normal supply.' : 'No other matching service advisories.')} />
    {ordered.map(notice => <View key={notice.id} style={[styles.item, quality(notice) && { borderLeftWidth: 3, borderLeftColor: '#a63030', paddingLeft: 12 }]}>
      <Demo visible={notice.demo} /><StatusLabel value={notice.state} />
      <Body muted>{({ current: 'In effect', upcoming: 'Upcoming service period', past: 'Past service period', lifted: 'Lifted', draft: 'Draft' })[advisoryPhase(notice)]}</Body>
      <Body>{notice.title}</Body><Body muted>{label(notice.kind)}</Body>
      {quality(notice) && notice.state === 'published' && <Body>This restriction remains in effect until the supplier explicitly lifts it.</Body>}
      <Body>{notice.text}</Body>
      <AdvisoryContext notice={notice} connections={connections} verified={verified} />
      <Body muted>{notice.source} · Updated {displayTime(notice.updatedAt)}</Body>
      <Button title="Read advisory" secondary onPress={() => navigate(`/advisories/${notice.id}`)} />
    </View>)}
  </Section>;
}

export function IncidentSummaries() {
  const incidents = useAllResources<PublishedIncident>('/incidents', true);
  const [history, setHistory] = useState(false);
  const active = incidents.data?.filter(incident => history || incident.status !== 'resolved');
  return <Section title={history ? 'Published incident history' : 'Current service incidents'}>
    <Body muted>All supplier-published incidents are shown regardless of your location. Private reports and unpublished incidents are not included.</Body>
    <Button title={history ? 'Show current incidents' : 'Include resolved incidents'} secondary selected={history} onPress={() => setHistory(!history)} />
    <Button title="Refresh incidents" secondary disabled={incidents.loading} onPress={() => void incidents.reload()} />
    <ResourceState {...incidents} empty={active?.length === 0 && 'No published incidents found for this view. This does not establish normal supply.'} />
    {active?.map(incident => <View key={incident.id} style={styles.item}>
      <Demo visible={incident.demo} /><StatusLabel value={incident.status} />
      <Body>{incident.summary}</Body><Body muted>Affected area: {incident.latestUpdate.area}</Body>
      <Body>{incident.latestUpdate.progress}</Body>
      <Body muted>Estimated restoration: {displayTime(incident.latestUpdate.restorationAt)}</Body>
      <Body muted>Latest published update: {displayTime(incident.latestUpdate.publishedAt)}</Body>
      <Button title="View incident / mark affected" secondary onPress={() => navigate(`/incidents/${incident.id}`)} />
    </View>)}
  </Section>;
}
