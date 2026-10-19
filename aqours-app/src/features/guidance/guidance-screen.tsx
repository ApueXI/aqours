import type { AssistanceType } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Choices, ErrorNotice, Field, Loading, Screen, Section, navigate, styles } from '@/components/ui';
import { useCommand } from '@/hooks/use-command';
import { displayTime, label, parseManilaInput } from '@/lib/time';
import { useGuidance, type GuidanceAnswers } from './use-guidance';

type Choice = AssistanceType | 'decline';
const binaryKeys = ['needsWater', 'hazard', 'persistent'] as const;

export function GuidanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useGuidance(id);
  const [answers, setAnswers] = useState<GuidanceAnswers>({});
  const [neededBy, setNeededBy] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const choice = useCommand<{ id: string; action: Choice; createdAt: string }>();
  const guidance = resource.guidance;

  async function evaluate() {
    setValidation(null); setDeclined(false);
    const waterNeededBy = neededBy ? parseManilaInput(neededBy) : undefined;
    if (neededBy && !waterNeededBy) { setValidation('Use YYYY-MM-DD HH:mm for the water-needed time in Asia/Manila.'); return; }
    await resource.evaluate({ ...answers, ...(waterNeededBy ? { waterNeededBy } : {}) });
  }
  async function choose(action: Choice) {
    if (!guidance?.current) return;
    const intended = choice.uncertain ? pendingChoice ?? action : action;
    setPendingChoice(intended);
    const result = await choice.execute(`/guidance/${guidance.id}/choice`, { action: intended });
    if (!result) return;
    setPendingChoice(null);
    if (result.action === 'decline') setDeclined(true);
    else navigate(`/assistance/new?reportId=${id}&type=${result.action}`);
  }

  return <Screen title="Guidance and next steps">
    <Body muted>Guidance explains current supplier records and your answers. A recommendation does not create a service request or determine water safety.</Body>
    <Section title="Questions about your report">
      {guidance?.questions.map((question) => <View key={question.key} style={{ gap: 8 }}>
        <Body>{question.label}</Body>
        {binaryKeys.includes(question.key as typeof binaryKeys[number]) ? <Choices values={question.options} value={answers[question.key as typeof binaryKeys[number]] === undefined ? null : answers[question.key as typeof binaryKeys[number]] ? 'yes' : 'no'}
          disabled={choice.locked} onChange={(value) => setAnswers({ ...answers, [question.key]: value === 'yes' })} />
          : question.key === 'nearbyAffected' ? <Choices values={['yes', 'no', 'unknown'] as const} value={answers.nearbyAffected ?? null}
            disabled={choice.locked} onChange={(value) => setAnswers({ ...answers, nearbyAffected: value })} /> : null}
      </View>)}
      <Field label="When do you need water? (optional, YYYY-MM-DD HH:mm, Asia/Manila)" value={neededBy} onChangeText={setNeededBy} editable={!choice.locked} />
      <ErrorNotice error={validation} />
      <Button title="Evaluate current answers" secondary disabled={resource.loading || choice.locked} onPress={() => void evaluate()} />
    </Section>
    {resource.loading && <Loading text="Verifying current sources…" />}
    <ErrorNotice error={resource.error} retry={() => void evaluate()} />
    {guidance && !guidance.current && <>
      <Body>Source records changed. Earlier guidance is historical and has been hidden. Refresh before choosing a recommendation.</Body>
      <Button title="Refresh current guidance" onPress={() => void evaluate()} />
    </>}
    {guidance?.current && <>
      <Body muted>Evaluated {displayTime(guidance.evaluatedAt)} · Rule version {guidance.ruleVersion}</Body>
      <Body muted>Applicable official advisories appear first, then incident context and assistance. Supplier escalation remains available.</Body>
      {guidance.uncertainty.map((text, index) => <Body key={index}>{text}</Body>)}
      {guidance.cards.map((card, index) => <Section key={`${card.action}-${index}`} title={card.title}>
        <Body>{card.reason}</Body><Body muted>Source: {card.source} · Updated {displayTime(card.updatedAt)}{card.sourceVersion === null ? '' : ` · Revision ${card.sourceVersion}`}</Body>
        {card.sourceId && card.action === 'incident' && <Button title="Read published incident" secondary onPress={() => navigate(`/incidents/${card.sourceId}`)} />}
        {card.sourceId && card.sourceType === 'advisory' && <Button title="Read current advisory" secondary onPress={() => navigate(`/advisories/${card.sourceId}`)} />}
        {(card.action === 'escalation' || card.sourceType === 'guidance') && <Button title="Ask supplier support about this guidance" secondary disabled={choice.busy || declined} onPress={() => void choose('callback')} />}
        {['callback', 'inspection', 'water_support'].includes(card.action) && <Button title={`Choose ${label(card.action).toLowerCase()}`} disabled={choice.busy || declined} onPress={() => void choose(card.action as AssistanceType)} />}
      </Section>)}
      <Section title="Your choice">
        <Body muted>Choosing a service opens its form. Only confirming that form submits a request.</Body>
        {guidance.alternatives.map((action) => <Button key={action} title={`Choose ${label(action).toLowerCase()}`} secondary disabled={choice.busy || declined} onPress={() => void choose(action)} />)}
        <Button title={declined ? 'Recommendation declined' : 'Decline recommendation'} secondary disabled={choice.busy || declined} onPress={() => void choose('decline')} />
        {declined && <Body>Your choice is recorded. No assistance request was created.</Body>}
      </Section>
    </>}
    <ErrorNotice error={choice.error} />
    {choice.uncertain && <>
      <Body>Choice confirmation is pending. Retry the same choice; no service request is created here.</Body>
      <Button title="Retry same choice" disabled={choice.busy} onPress={() => pendingChoice && void choose(pendingChoice)} />
    </>}
    <View style={styles.section}>
      <Button title="Open callback/support form" secondary onPress={() => navigate(`/assistance/new?reportId=${id}&type=callback`)} />
      <Button title="Return to report / contact supplier" secondary onPress={() => navigate(`/reports/${id}`)} />
    </View>
  </Screen>;
}
