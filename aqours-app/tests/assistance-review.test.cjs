const assert = require('node:assert/strict');
const { test } = require('node:test');
const { screenRuntime, nodes, control } = require('./mobile-ui-runtime.cjs');

function form(type) {
  const commands = [];
  const resource = { data: { id: 'owned-report', reference: 'REP-1', category: 'outage', address: 'Original visit address' }, loading: false, error: null };
  const command = { locked: false, busy: false, uncertain: false, error: null,
    execute: async (...args) => { commands.push(args); return null; } };
  const runtime = screenRuntime('features/assistance/screens/assistance-form.tsx', {
    '@/hooks/use-resource': { useResource: () => resource }, '@/hooks/use-command': { useCommand: () => command },
  });
  const render = () => runtime.render('AssistanceForm');
  if (type !== 'callback') nodes(render(), 'Choices')[0].props.onChange(type);
  return { render, commands, resource, command };
}

for (const type of ['callback', 'inspection', 'water_support']) {
  test(`${type} requires review and explicit confirmation using the reviewed payload`, async () => {
    const runtime = form(type);
    let tree = runtime.render();
    control(tree, 'Button', 'Review request').onPress();
    await Promise.resolve();
    assert.equal(runtime.commands.length, 0);
    assert.ok(nodes(runtime.render(), 'ErrorNotice')[0].props.error);
    tree = runtime.render();
    if (type === 'callback') {
      control(tree, 'Field', 'Your question').onChangeText('Please call about our water');
      control(tree, 'Field', 'Preferred date and time window (Asia/Manila)').onChangeText('Tomorrow 9am–12pm');
    } else if (type === 'inspection') {
      control(tree, 'Field', 'Issue details for inspection').onChangeText('No pressure at the main tap');
      control(tree, 'Field', 'Access instructions').onChangeText('Use the front gate');
      control(tree, 'Field', 'Preferred date and time window (Asia/Manila)').onChangeText('Tomorrow 9am–12pm');
    } else {
      control(tree, 'Field', 'Requested liters').onChangeText('12.50');
      nodes(tree, 'PickupOptions')[0].props.onChange('pickup-session', { id: 'pickup-session', site: { name: 'Barangay Hall' } });
    }
    control(runtime.render(), 'Button', 'Review request').onPress();
    await Promise.resolve();
    tree = runtime.render();
    const reviewed = nodes(tree, 'AssistanceSummary')[0].props.details;
    assert.ok(reviewed);
    assert.equal(runtime.commands.length, 0);
    runtime.resource.data = { ...runtime.resource.data, address: 'Changed address after refresh' };
    control(runtime.render(), 'Button', 'Confirm and submit request').onPress();
    await Promise.resolve();
    assert.deepEqual(runtime.commands, [['/assistance-requests', { reportId: 'owned-report', type, details: reviewed }]]);
    if (type === 'inspection') assert.equal(reviewed.siteAddress, 'Original visit address');
    if (type === 'water_support') assert.equal(reviewed.requestedLiters, '12.50');
    runtime.command.locked = true;
    runtime.command.uncertain = true;
    tree = runtime.render();
    assert.equal(control(tree, 'Button', 'Back to request details').disabled, true);
    assert.equal(nodes(tree, 'FormBack')[0].props.locked, true);
    assert.equal(control(tree, 'Button', 'Review existing requests').disabled, true);
    assert.equal(control(tree, 'Button', 'Retry same assistance request').disabled, false);
  });
}
