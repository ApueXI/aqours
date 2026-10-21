import type { Connection } from '@aqours/contracts';
import { Body, Button, Section } from '@/components/ui';
import { displayTime, label, parseManilaInput } from '@/utils/time';
import type { ReportDraft } from '../utils/report-draft';

export function ReportReview({ draft, connection, disabled, edit }: {
  draft: ReportDraft; connection?: Connection; disabled: boolean; edit(step: number): void;
}) {
  return <>
    <Body muted>Check these details before sending them to your supplier.</Body>
    <Section title={label(draft.category)}>
      <Body>{draft.description}</Body>
      {!!draft.guidedDetails.trim() && <Body>{draft.guidedDetails}</Body>}
      <Body muted>Noticed {displayTime(parseManilaInput(draft.noticed))} · Asia/Manila</Body>
      <Button title="Edit problem" secondary disabled={disabled} onPress={() => edit(0)} />
    </Section>
    <Section title="Issue location">
      <Body>{connection?.reference ?? 'No connection selected'}</Body>
      <Body>{draft.location?.address ?? connection?.address}</Body>
      <Body muted>{draft.location ? draft.location.confirmed
        ? 'Confirmed alternate point. The supplier will review its service zone.'
        : 'Address only. The supplier will review the location.' : 'Saved service address'}</Body>
      {draft.location?.latitude != null && <Body muted>{draft.location.latitude}, {draft.location.longitude}</Body>}
      <Button title="Edit location" secondary disabled={disabled} onPress={() => edit(1)} />
    </Section>
    <Section title={`Photos · ${draft.photos.length} selected`}>
      {draft.photos.length ? draft.photos.map((photo, index) => <Body key={`${photo.uri}-${index}`}>{photo.name}</Body>) : <Body muted>No photos selected. You can add them later.</Body>}
      <Body muted>Photos upload separately after your report is saved.</Body>
      <Button title="Edit photos" secondary disabled={disabled} onPress={() => edit(2)} />
    </Section>
  </>;
}
