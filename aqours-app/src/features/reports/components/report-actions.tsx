import type { Report, ReportDetail } from '@aqours/contracts';
import { useState } from 'react';
import { Body, Button, ErrorNotice, Field, Section } from '@/components/ui';
import { useCommand } from '@/hooks/use-command';
import { PhotoPicker, PhotoUpload, type Photo } from './photos';

export function StillAffected({ report, reload }: { report: ReportDetail; reload(): Promise<void> }) {
  const [reason, setReason] = useState('');
  const followup = useCommand<Report>();
  async function submit() {
    if (!reason.trim()) return;
    const result = await followup.execute(`/reports/${report.id}/still-affected`, { expectedVersion: report.version, reason: reason.trim() });
    if (result) await reload();
  }
  return <Section title="Still affected?">
    <Body muted>This returns your report for supplier review and preserves its resolution history.</Body>
    <Field label="What is still happening?" value={reason} onChangeText={setReason} multiline maxLength={2000} editable={!followup.locked} />
    <ErrorNotice error={followup.error} />
    <Button title={followup.busy ? 'Sending…' : followup.uncertain ? 'Retry same follow-up' : 'Request another review'} disabled={followup.busy || !reason.trim()} onPress={() => void submit()} />
    {followup.error && !followup.uncertain && <Button title="Refresh current report" secondary onPress={() => void reload()} />}
  </Section>;
}

export function AddReportPhotos({ reportId }: { reportId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  return <>
    <PhotoPicker photos={photos} onChange={setPhotos} disabled={photos.length > 0} />
    {photos.map((photo) => <PhotoUpload key={photo.uri} reportId={reportId} photo={photo} />)}
  </>;
}
