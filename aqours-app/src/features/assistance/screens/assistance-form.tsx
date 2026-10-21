import type { AssistanceDetails, AssistanceRequest, AssistanceType, PickupSession, ReportDetail } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSession } from '@/features/auth/hooks/session';
import { Body, Button, Choices, ErrorNotice, Field, Screen, Section, navigate } from '@/components/ui';
import { FormBack } from '@/components/form-back';
import { ResourceState } from '@/components/resource-state';
import { useCommand } from '@/hooks/use-command';
import { useResource } from '@/hooks/use-resource';
import { label } from '@/utils/time';
import { PickupOptions } from '../components/pickup-options';
import { AssistanceSummary, assistanceNames } from '../components/assistance-summary';

const types: AssistanceType[] = ['callback', 'inspection', 'water_support'];

export function AssistanceForm() {
  const { reportId, type: initialType } = useLocalSearchParams<{ reportId: string; type?: AssistanceType }>();
  const { user } = useSession();
  const report = useResource<ReportDetail>(reportId ? `/reports/${reportId}` : null);
  const [type, setType] = useState<AssistanceType>(types.includes(initialType!) ? initialType! : 'callback');
  const [question, setQuestion] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [window, setWindow] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [site, setSite] = useState('');
  const [access, setAccess] = useState('');
  const [liters, setLiters] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [review, setReview] = useState<AssistanceDetails | null>(null);
  const [pickup, setPickup] = useState<PickupSession | null>(null);
  const command = useCommand<AssistanceRequest>();

  async function submit() {
    setValidation(null);
    if (review) {
      const result = await command.execute('/assistance-requests', { reportId, type, details: review });
      if (result) navigate(`/assistance/${result.id}`);
      return;
    }
    let details: AssistanceDetails;
    if (type === 'callback') {
      if (!question.trim() || !phone.trim() || !window.trim()) { setValidation('Enter a question, contact number, and preferred time window.'); return; }
      details = { question: question.trim(), contactMethod: 'phone', contactNumber: phone.trim(), preferredWindow: window.trim() };
    } else if (type === 'inspection') {
      if (!issueDetails.trim() || !(site.trim() || report.data?.address) || !window.trim() || !access.trim()) { setValidation('Enter issue details, the visit address, access instructions, and a preferred time window.'); return; }
      details = { issueDetails: issueDetails.trim(), siteAddress: site.trim() || report.data!.address, accessInstructions: access.trim(), preferredWindow: window.trim() };
    } else {
      if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(liters) || Number(liters) <= 0 || Number(liters) > 1000000000 || !sessionId) {
        setValidation('Enter a positive quantity with up to two decimals and choose a listed available pickup session, or request callback/support.'); return;
      }
      details = { requestedLiters: liters, sessionId, ...(notes.trim() ? { notes: notes.trim() } : {}) };
    }
    setReview(details);
  }

  return <Screen title={review ? 'Review your request' : 'Request assistance'} scrollKey={review ? 'review' : 'details'}>
    <FormBack previous={review ? () => setReview(null) : undefined} locked={command.locked} fallback="/assistance" />
    {!reportId && <><Body>Choose one of your reports first, then open its assistance form.</Body><Button title="Choose a report" onPress={() => navigate('/reports')} /></>}
    <ResourceState {...report} />
    {report.data && <>
      <Body>For {report.data.reference} · {label(report.data.category)}</Body>
      <View style={{ display: review ? 'none' : 'flex', gap: 16 }}>
        <Choices<AssistanceType> values={types} labels={assistanceNames} value={type} onChange={setType} disabled={command.locked} />
        <Body muted>Submitting creates a request for review. Acceptance, appointments, and pickup stock require supplier confirmation.</Body>
        {type === 'callback' && <Section title="Callback/support">
          <Field label="Your question" value={question} onChangeText={setQuestion} multiline maxLength={5000} editable={!command.locked} />
          <Body>Preferred contact method: phone</Body>
          <Field label="Contact number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40} editable={!command.locked} />
        </Section>}
        {type === 'inspection' && <Section title="Site inspection">
          <Field label="Issue details for inspection" value={issueDetails} onChangeText={setIssueDetails} multiline maxLength={5000} editable={!command.locked} />
          <Field label="Visit address (report address shown by default)" value={site || report.data.address} onChangeText={setSite} multiline maxLength={1000} editable={!command.locked} />
          <Field label="Access instructions" value={access} onChangeText={setAccess} multiline maxLength={2000} editable={!command.locked} />
        </Section>}
        {type !== 'water_support' && <Field label="Preferred date and time window (Asia/Manila)" value={window} onChangeText={setWindow} placeholder="For example: 21 October, 9am–12pm" maxLength={300} editable={!command.locked} />}
        {type === 'water_support' && <>
          <Field label="Requested liters" value={liters} onChangeText={setLiters} keyboardType="decimal-pad" maxLength={14} editable={!command.locked} />
          <Field label="Additional pickup notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={2000} editable={!command.locked} />
          <PickupOptions reportId={reportId} selected={sessionId} onChange={(id, session) => { setSessionId(id); setPickup(session); }} onCallback={() => setType('callback')} disabled={command.locked} />
        </>}
      </View>
      {review && <>
        <Section title={assistanceNames[type]}>
          <Body>For {report.data.reference}</Body>
          <Body muted>The supplier will review this request. Appointments and pickup stock are confirmed separately.</Body>
        </Section>
        <AssistanceSummary details={review} pickup={type === 'water_support' ? pickup : null} />
      </>}
      <ErrorNotice error={validation ?? command.error} />
      {command.uncertain && <Body>Confirmation is pending. Retry this same request before starting another.</Body>}
      <Button title={command.busy ? 'Submitting…' : command.uncertain ? 'Retry same assistance request' : review ? 'Confirm and submit request' : 'Review request'} disabled={command.busy} onPress={() => void submit()} />
      {review && <Button title="Back to request details" secondary disabled={command.locked} onPress={() => setReview(null)} />}
      <Button title="Review existing requests" secondary disabled={command.locked} onPress={() => navigate('/assistance')} />
    </>}
  </Screen>;
}
