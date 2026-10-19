import { categories, type Category, type Connection, type LocationInput, type Report } from '@aqours/contracts';
import { useState } from 'react';
import { Body, Button, Choices, ErrorNotice, Field, Screen, Section, navigate } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useCommand } from '@/hooks/use-command';
import { useResource } from '@/hooks/use-resource';
import { displayTime, localInputNow, parseManilaInput } from '@/lib/time';
import { LocationPicker } from '@/features/location/location-picker';
import { PhotoPicker, PhotoUpload, type Photo } from './photos';

const prompts: Record<Category, string> = {
  outage: 'When did the supply stop? Is it continuous or intermittent?',
  low_pressure: 'Which taps or areas have low pressure? Is it constant or intermittent?',
  leak: 'Where is the leak? Describe visible flow and any immediate access hazards.',
  water_quality: 'Describe the color, odor, or visible change without tasting the water.',
};

export function ReportForm() {
  const connections = useResource<Connection[]>('/me/connections');
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('outage');
  const [description, setDescription] = useState('');
  const [guidedDetails, setGuidedDetails] = useState('');
  const [noticed, setNoticed] = useState(localInputNow);
  const [location, setLocation] = useState<LocationInput | null>(null);
  const [locationReady, setLocationReady] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [validation, setValidation] = useState<string | null>(null);
  const command = useCommand<Report>();
  const connection = connections.data?.find((item) => item.id === selected) ?? connections.data?.[0];

  async function submit() {
    setValidation(null);
    const noticedAt = parseManilaInput(noticed);
    if (!connection || !description.trim() || !noticedAt || Date.parse(noticedAt) > Date.now() + 60000 || !locationReady) {
      setValidation('Choose a connection, describe the problem, enter a valid time that is not in the future, and confirm the issue location.');
      return;
    }
    await command.execute('/reports', {
      connectionId: connection.id, category, description: description.trim(), noticedAt,
      ...(location ? { location } : {}), answers: { details: guidedDetails.trim() },
    });
  }

  if (command.result) return <Screen title="Report received">
    <Body>Tracking reference: {command.result.reference}</Body>
    <Body>Status: received</Body><Body>Submitted {displayTime(command.result.submittedAt)}</Body>
    {command.result.locationReview && <Body muted>The supplier will review the issue location.</Body>}
    <Body muted>Your report is saved. Upload your selected photos below; retrying a photo never submits the report again.</Body>
    {photos.map((photo) => <PhotoUpload key={photo.uri} reportId={command.result!.id} photo={photo} />)}
    <Button title="Open report and guidance" onPress={() => navigate(`/reports/${command.result!.id}`)} />
  </Screen>;

  return <Screen title="Report a problem">
    <ResourceState {...connections} empty={connections.data?.length === 0 && 'A saved connection is required. Ask the supplier to provision it.'} />
    {connections.data?.map((item) => <Button key={item.id} title={`${item.reference} · ${item.address}`} selected={item.id === connection?.id} secondary disabled={command.locked}
      onPress={() => { setSelected(item.id); setLocation(null); setLocationReady(true); }} />)}
    <Section title="Problem details">
      <Choices values={categories} value={category} disabled={command.locked} onChange={(next) => { setCategory(next); setGuidedDetails(''); }} />
      <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={5000} editable={!command.locked} />
      <Field label={prompts[category]} value={guidedDetails} onChangeText={setGuidedDetails} multiline maxLength={2000} editable={!command.locked} />
      <Field label="Time noticed (Asia/Manila, YYYY-MM-DD HH:mm)" value={noticed} onChangeText={setNoticed} editable={!command.locked} autoCapitalize="none" />
    </Section>
    {connection && <LocationPicker key={connection.id} connection={connection} value={location} onChange={setLocation} onReadyChange={setLocationReady} disabled={command.locked} />}
    <PhotoPicker photos={photos} onChange={setPhotos} disabled={command.locked} />
    <ErrorNotice error={validation ?? command.error} />
    {command.uncertain && <Body>The result is unconfirmed. Keep this screen open and retry the same report with unchanged details.</Body>}
    <Button title={command.busy ? 'Submitting…' : command.uncertain ? 'Retry same report' : 'Submit report'} disabled={command.busy || !connection} onPress={() => void submit()} />
  </Screen>;
}
