import { categories, type Category, type Report } from '@aqours/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Choices, Screen, navigate, styles } from '@/components/ui';
import { Paging, ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';

export function ReportList() {
  const [offset, setOffset] = useState(0);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const reports = useResource<Report[]>(`/reports?offset=${offset}&limit=30${category === 'all' ? '' : `&category=${category}`}`);
  return <Screen title="Your reports">
    <Button title="New report" onPress={() => navigate('/reports/new')} />
    <Choices values={['all', ...categories]} value={category} onChange={(value) => { setCategory(value); setOffset(0); }} />
    <ResourceState {...reports} empty={reports.data?.length === 0 && 'No reports match this view.'} />
    {reports.data?.map((report) => <View key={report.id} style={styles.item}>
      <Body>{report.reference} · {label(report.category)}</Body><Body>{label(report.status)}</Body>
      <Body muted>{report.address} · {displayTime(report.submittedAt)}</Body>
      {report.closureOutcome && <Body muted>Closure: {label(report.closureOutcome)}</Body>}
      <Button title="View report" secondary onPress={() => navigate(`/reports/${report.id}`)} />
    </View>)}
    <Paging offset={offset} total={reports.page?.total} onChange={setOffset} />
  </Screen>;
}
