import { categories, type Category, type Connection, type Report } from '@aqours/contracts';
import { useReducer } from 'react';
import { Text, View } from 'react-native';
import { Body, Button, Choices, ErrorNotice, Field, Screen, Section, styles, navigate } from '@/components/ui';
import { FormBack } from '@/components/form-back';
import { ResourceState } from '@/components/resource-state';
import { useCommand } from '@/hooks/use-command';
import { useResource } from '@/hooks/use-resource';
import { displayTime, localInputNow, parseManilaInput } from '@/utils/time';
import { LocationPicker } from '@/features/location/components/location-picker';
import { PhotoPicker, PhotoUpload } from '../components/photos';
import { ReportProgress } from '../components/report-progress';
import { ReportReview } from '../components/report-review';
import { createReportDraft, reportDraftReducer, reportStepError, reportSteps } from '../utils/report-draft';

const prompts: Record<Category, string> = {
  outage: 'When did the supply stop? Is it continuous or intermittent?',
  low_pressure: 'Which taps or areas have low pressure? Is it constant or intermittent?',
  leak: 'Where is the leak? Describe visible flow and any immediate access hazards.',
  water_quality: 'Describe the color, odor, or visible change without tasting the water.',
};
const categoryNames = { outage: 'No water', low_pressure: 'Low pressure', leak: 'Leak', water_quality: 'Water quality' };

export function ReportForm() {
  const connections = useResource<Connection[]>('/me/connections');
  const [draft, dispatch] = useReducer(reportDraftReducer, localInputNow(), createReportDraft);
  const command = useCommand<Report>();
  const connection = draft.selected ? connections.data?.find((item) => item.id === draft.selected) : connections.data?.[0];

  async function submit() {
    for (const step of [0, 1]) {
      const error = reportStepError(draft, step, !!connection, Date.now());
      if (error) { dispatch({ type: 'error', message: error, step }); return; }
    }
    await command.execute('/reports', {
      connectionId: connection!.id, category: draft.category, description: draft.description.trim(),
      noticedAt: parseManilaInput(draft.noticed), ...(draft.location ? { location: draft.location } : {}),
      answers: { details: draft.guidedDetails.trim() },
    });
  }


  if (command.result) return <Screen title="Report received">
    <FormBack locked={command.locked} fallback="/reports" />
    <Section title={command.result.reference}>
      <Body>Your supplier has received this report.</Body>
      <Body muted>Status: received · Submitted {displayTime(command.result.submittedAt)}</Body>
      {command.result.locationReview && <Body muted>The supplier will review the issue location.</Body>}
    </Section>
    {!!draft.photos.length && <Body>Your report is saved. Upload your selected photos below. Each photo retries separately.</Body>}
    {draft.photos.map((photo) => <PhotoUpload key={photo.uri} reportId={command.result!.id} photo={photo} />)}
    <Button title="Open report and guidance" onPress={() => navigate(`/reports/${command.result!.id}`)} />
  </Screen>;

  return <Screen title="Report a water problem" scrollKey={draft.step}>
    <FormBack previous={draft.step > 0 ? () => dispatch({ type: 'back' }) : undefined} locked={command.locked} fallback="/reports" />
    <ReportProgress step={draft.step} />
    {/* Keep location and picker subtrees mounted while moving between steps. */}
    <View style={{ display: draft.step === 0 ? 'flex' : 'none', gap: 16 }}>
      <Section title="What is happening?">
        <Choices values={categories} labels={categoryNames} value={draft.category} disabled={command.locked}
          onChange={value => dispatch({ type: 'category', value })} />
        <Field label="Describe the problem" value={draft.description} onChangeText={description => dispatch({ type: 'edit', patch: { description } })}
          error={draft.error && !draft.description.trim() ? 'Describe the water problem.' : null}
          hint="Include what changed and how it affects your water service." multiline maxLength={5000} editable={!command.locked} />
        <Field label={prompts[draft.category]} value={draft.guidedDetails} onChangeText={guidedDetails => dispatch({ type: 'edit', patch: { guidedDetails } })}
          multiline maxLength={2000} editable={!command.locked} />
        <Field label="When did you notice it?" hint="Asia/Manila · YYYY-MM-DD HH:mm" value={draft.noticed}
          error={draft.error && draft.description.trim() ? draft.error : null}
          onChangeText={noticed => dispatch({ type: 'edit', patch: { noticed } })} editable={!command.locked} autoCapitalize="none" />
      </Section>
    </View>
    <View style={{ display: draft.step === 1 ? 'flex' : 'none', gap: 16 }}>
      <Section title="Choose your connection">
        <ResourceState {...connections} empty={connections.data?.length === 0 && 'A saved connection is required. Ask the supplier to provision it.'} />
        {connections.data?.map((item) => <Button key={item.id} title={`${item.reference} · ${item.address}`} selected={item.id === connection?.id}
          secondary disabled={command.locked} onPress={() => dispatch({ type: 'connection', id: item.id })} />)}
      </Section>
      {connection && draft.visited >= 1 && <LocationPicker key={connection.id} connection={connection} value={draft.location}
        onChange={location => dispatch({ type: 'edit', patch: { location } })}
        onReadyChange={locationReady => dispatch({ type: 'edit', patch: { locationReady } })} disabled={command.locked} />}
    </View>
    <View style={{ display: draft.step === 2 ? 'flex' : 'none' }}>
      {draft.visited >= 2 && <PhotoPicker photos={draft.photos} onChange={photos => dispatch({ type: 'edit', patch: { photos } })} disabled={command.locked} />}
    </View>
    {draft.step === 3 && <ReportReview draft={draft} connection={connection} disabled={command.locked} edit={step => dispatch({ type: 'review', step })} />}
    <ErrorNotice error={draft.error ?? command.error} />
    {command.uncertain && <Body>The result is unconfirmed. Retry the same report with these unchanged details.</Body>}
    {draft.step < 3 ? <Button title={`Continue to ${reportSteps[draft.step + 1].toLowerCase()}`} disabled={command.locked}
      onPress={() => dispatch({ type: 'next', hasConnection: !!connection, now: Date.now() })} />
      : <Button title={command.busy ? 'Submitting…' : command.uncertain ? 'Retry same report' : 'Confirm and submit report'}
        disabled={command.busy || !connection} onPress={() => void submit()} />}
    {draft.step > 0 && <Button title={`Back to ${reportSteps[draft.step - 1].toLowerCase()}`} secondary disabled={command.locked} onPress={() => dispatch({ type: 'back' })} />}
    <Text style={styles.muted}>Your details stay in this draft while you move between steps. Submit only after reviewing them.</Text>
  </Screen>;
}
