const assert = require('node:assert/strict');
const { test } = require('node:test');
const { screenRuntime, nodes, control } = require('./mobile-ui-runtime.cjs');

function questionnaire() {
  const calls = [];
  const questions = [{ key: 'needsWater', label: 'Do you need water?', options: ['yes', 'no'] }, { key: 'nearbyAffected', label: 'Are neighbors affected?', options: ['yes', 'no', 'unknown'] }];
  const resource = { questions, loading: false, error: null, guidance: { id: 'guidance-a', questions, current: true, cards: [], alternatives: ['callback'], uncertainty: [], evaluatedAt: '', ruleVersion: 1 },
    evaluate: async value => { calls.push(value); return resource.guidance; } };
  const commands = [];
  const runtime = screenRuntime('features/guidance/screens/guidance-screen.tsx', {
    '../hooks/use-guidance': { useGuidance: () => resource },
    '@/hooks/use-command': { useCommand: () => ({ busy: false, locked: false, execute: async (...args) => { commands.push(args); return null; } }) },
    'expo-router': { useLocalSearchParams: () => ({ id: 'report-a' }) },
  });
  return { resource, calls, commands, render: () => runtime.render('GuidanceScreen') };
}

test('question answers submit booleans and unknown, then invalidate earlier recommendations when edited', async () => {
  const r = questionnaire();
  nodes(r.render(), 'Choices')[0].props.onChange('no');
  control(r.render(), 'Button', 'Next question').onPress();
  nodes(r.render(), 'Choices')[0].props.onChange('unknown');
  await control(r.render(), 'Button', 'Submit answers').onPress();
  await Promise.resolve();
  assert.deepEqual(r.calls[0], { needsWater: false, nearbyAffected: 'unknown' });
  assert.equal(control(r.render(), 'Button', 'Choose callback').disabled, false);
  nodes(r.render(), 'Choices')[0].props.onChange('yes');
  assert.equal(control(r.render(), 'Button', 'Choose callback').disabled, true);
  assert.equal(r.commands.length, 0);
});

test('questionnaire remains visible while verification hides earlier guidance and reports invalid time', () => {
  const r = questionnaire();
  r.resource.loading = true; r.resource.guidance = null;
  assert.equal(nodes(r.render(), 'Choices').length, 1);
  assert.equal(control(r.render(), 'Button', 'Submitting answers…').disabled, true);
  r.resource.loading = false;
  nodes(r.render(), 'Field')[0].props.onChangeText('invalid');
  control(r.render(), 'Button', 'Submit answers').onPress();
  assert.match(nodes(r.render(), 'ErrorNotice')[0].props.error, /YYYY-MM-DD/);
  assert.equal(r.calls.length, 0);
});

test('foreground polling does not replace an answer submission before its receipt arrives', async () => {
  let focused, poll, appStateHandler;
  let pending;
  const requests = [];
  const originalInterval = global.setInterval;
  const originalClear = global.clearInterval;
  global.setInterval = callback => { poll = callback; return 1; };
  global.clearInterval = () => {};
  try {
    const runtime = screenRuntime('features/guidance/hooks/use-guidance.ts', {
      'expo-router': { useFocusEffect: callback => { focused = callback; } },
      'react-native': { AppState: { currentState: 'active', addEventListener: (_, callback) => { appStateHandler = callback; return { remove() {} }; } } },
      '@/features/auth/hooks/session': { useSession: () => ({ api: (path, options) => {
        requests.push({ path, options });
        return new Promise(resolve => { pending = resolve; });
      } }) },
      '@/services/http-client': { errorText: error => String(error) },
    });
    runtime.render('useGuidance', 'report-a');
    focused();
    pending({ data: { id: 'initial', questions: [] } });
    await Promise.resolve(); await Promise.resolve();
    const hook = runtime.render('useGuidance', 'report-a');
    const submitted = hook.evaluate({ needsWater: false });
    poll(); appStateHandler('active');
    assert.equal(requests.length, 2, 'initial load and explicit evaluation only');
    pending({ data: { id: 'submitted', questions: [] } });
    assert.equal((await submitted).id, 'submitted');
  } finally { global.setInterval = originalInterval; global.clearInterval = originalClear; }
});
