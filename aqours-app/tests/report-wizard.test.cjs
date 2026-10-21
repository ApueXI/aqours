require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { screenRuntime, nodes, control } = require('./mobile-ui-runtime.cjs');
const { createReportDraft, reportDraftReducer, reportStepError } = require('../src/features/reports/utils/report-draft.ts');

const connection = { id: 'owned-connection', reference: 'CON-1', address: 'Barangay Test', latitude: null, longitude: null };
function wizard() {
  const commands = [];
  const resource = { data: [connection], loading: false, error: null, reload: async () => {} };
  const command = { busy: false, locked: false, uncertain: false, result: null, error: null,
    execute: async (...args) => { commands.push(args); return null; } };
  const runtime = screenRuntime('features/reports/screens/report-form.tsx', {
    '@/hooks/use-resource': { useResource: () => resource },
    '@/hooks/use-command': { useCommand: () => command },
  });
  return { ...runtime, command, commands, resource, render: () => runtime.render('ReportForm') };
}
function describe(runtime) {
  const tree = runtime.render();
  control(tree, 'Field', 'Describe the problem').onChangeText('No water since this morning');
  control(tree, 'Field', 'When did you notice it?').onChangeText('2020-01-01 08:30');
}

test('wizard validates each step and retains problem, alternate location and photos across next/back', () => {
  const runtime = wizard();
  let tree = runtime.render();
  control(tree, 'Button', 'Continue to location').onPress();
  tree = runtime.render();
  assert.match(nodes(tree, 'ErrorNotice')[0].props.error, /Describe/);
  assert.equal(nodes(tree, 'ReportProgress')[0].props.step, 0);
  describe(runtime);
  control(runtime.render(), 'Button', 'Continue to location').onPress();
  tree = runtime.render();
  const location = nodes(tree, 'LocationPicker')[0];
  const alternate = { address: 'Another barangay', source: 'gps', latitude: 14.6, longitude: 121.1, confirmed: true };
  location.props.onReadyChange(false);
  control(runtime.render(), 'Button', 'Continue to photos').onPress();
  assert.equal(nodes(runtime.render(), 'ReportProgress')[0].props.step, 1);
  location.props.onChange(alternate);
  location.props.onReadyChange(true);
  control(runtime.render(), 'Button', 'Continue to photos').onPress();
  tree = runtime.render();
  assert.equal(nodes(tree, 'LocationPicker')[0].key, location.key, 'location subtree identity remains stable');
  assert.equal(nodes(tree, 'LocationPicker')[0].props.value, alternate);
  const photo = { uri: 'file://draft.jpg', name: 'draft.jpg', type: 'image/jpeg' };
  nodes(tree, 'PhotoPicker')[0].props.onChange([photo]);
  control(runtime.render(), 'Button', 'Continue to review').onPress();
  tree = runtime.render();
  assert.equal(runtime.commands.length, 0, 'review does not submit');
  assert.equal(nodes(tree, 'ReportReview')[0].props.draft.description, 'No water since this morning');
  assert.deepEqual(nodes(tree, 'ReportReview')[0].props.draft.photos, [photo]);
  nodes(tree, 'ReportReview')[0].props.edit(0);
  tree = runtime.render();
  assert.equal(control(tree, 'Field', 'Describe the problem').value, 'No water since this morning');
  assert.equal(nodes(tree, 'PhotoPicker')[0].props.photos[0], photo);
  assert.equal(nodes(tree, 'LocationPicker')[0].key, location.key);
});

test('wizard refresh retains draft and explicit submit creates one report before separate photo receipt', async () => {
  const runtime = wizard();
  describe(runtime);
  control(runtime.render(), 'Button', 'Continue to location').onPress();
  control(runtime.render(), 'Button', 'Continue to photos').onPress();
  const photo = { uri: 'file://photo.jpg', name: 'photo.jpg', type: 'image/jpeg' };
  nodes(runtime.render(), 'PhotoPicker')[0].props.onChange([photo]);
  runtime.resource.loading = true;
  assert.equal(nodes(runtime.render(), 'PhotoPicker')[0].props.photos[0], photo, 'foreground refresh retains picker draft');
  runtime.resource.loading = false;
  control(runtime.render(), 'Button', 'Continue to review').onPress();
  control(runtime.render(), 'Button', 'Confirm and submit report').onPress();
  await Promise.resolve();
  assert.equal(runtime.commands.length, 1);
  assert.deepEqual(runtime.commands[0], ['/reports', {
    connectionId: connection.id, category: 'outage', description: 'No water since this morning',
    noticedAt: '2020-01-01T00:30:00.000Z', answers: { details: '' },
  }]);
  runtime.command.uncertain = true;
  runtime.command.locked = true;
  let tree = runtime.render();
  assert.equal(nodes(tree, 'ReportReview')[0].props.disabled, true);
  assert.equal(nodes(tree, 'FormBack')[0].props.locked, true);
  assert.equal(control(tree, 'Button', 'Back to photos').disabled, true);
  assert.equal(control(tree, 'Button', 'Retry same report').disabled, false);
  runtime.command.result = { id: 'saved-report', reference: 'REP-1', submittedAt: '2020-01-01T00:30:00Z' };
  runtime.command.locked = false;
  tree = runtime.render();
  assert.equal(nodes(tree, 'PhotoUpload')[0].props.reportId, 'saved-report');
  assert.equal(nodes(tree, 'PhotoUpload')[0].props.photo, photo);
  assert.equal(nodes(tree, 'ReportReview').length, 0);
  assert.equal(runtime.commands.length, 1);
});

test('report draft rejects normalized dates/future time and switching connection resets location only', () => {
  let draft = createReportDraft('2026-02-30 08:00');
  draft = reportDraftReducer(draft, { type: 'edit', patch: { description: 'Issue', guidedDetails: 'Details', photos: [{ uri: 'photo' }] } });
  assert.match(reportStepError(draft, 0, true, Date.now()), /YYYY-MM-DD/);
  draft = reportDraftReducer(draft, { type: 'edit', patch: { noticed: '2099-01-01 08:00' } });
  assert.match(reportStepError(draft, 0, true, Date.now()), /future/);
  draft = reportDraftReducer(draft, { type: 'edit', patch: { location: { address: 'Other', confirmed: true }, locationReady: false } });
  draft = reportDraftReducer(draft, { type: 'connection', id: 'another-owned' });
  assert.equal(draft.location, null);
  assert.equal(draft.locationReady, true);
  assert.equal(draft.description, 'Issue');
  assert.equal(draft.photos.length, 1);
  draft = reportDraftReducer(draft, { type: 'category', value: 'leak' });
  assert.equal(draft.guidedDetails, '');
  assert.equal(draft.description, 'Issue');
});
