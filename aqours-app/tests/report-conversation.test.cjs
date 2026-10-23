const assert = require('node:assert/strict');
const { test } = require('node:test');
const { screenRuntime, nodes, control } = require('./mobile-ui-runtime.cjs');

test('native message bubbles render oldest first and newest last even when the API returns descending timestamps', () => {
  const messages = [
    { id: 'later', text: 'Newest supplier update', authorRole: 'staff', createdAt: '2026-10-23T00:01:00Z' },
    { id: 'earlier', text: 'Oldest customer question', authorRole: 'customer', createdAt: '2026-10-22T23:59:00Z' },
  ];
  const runtime = screenRuntime('features/reports/components/report-conversation.tsx', {
    '../hooks/report-workspace': { useReportWorkspace: () => ({ resource: { data: { messages } }, text: '',
      message: {}, sentMessageId: null, setText() {}, send() {} }) },
    'react-native': { View: 'View', Text: 'Text', ScrollView: 'ScrollView' },
  });
  const texts = nodes(runtime.render('ReportConversation'), 'Body').map(node => node.props.children)
    .filter(text => ['Newest supplier update', 'Oldest customer question'].includes(text));
  assert.deepEqual(texts, ['Oldest customer question', 'Newest supplier update']);
  assert.equal(messages[0].id, 'later', 'rendering does not mutate API cache order');
});

test('report workspace retains a mounted draft across navigation and failures, clearing only after confirmed send', async () => {
  const calls = [];
  let confirmed = null;
  const resource = { data: { messages: [] }, reload: async () => calls.push('reload') };
  const command = { busy: false, locked: false, uncertain: false,
    execute: async (...args) => { calls.push(args); return confirmed; } };
  const runtime = screenRuntime('features/reports/hooks/report-workspace.tsx', {
    '@/hooks/use-resource': { useResource: () => resource },
    '@/hooks/use-command': { useCommand: () => command },
  });
  const workspace = () => runtime.render('ReportWorkspaceProvider', { id: 'owned-report', children: null }).props.value;
  workspace().setText('  Pressure is still low  ');
  assert.equal(workspace().text, '  Pressure is still low  ');
  await workspace().send();
  command.uncertain = true;
  assert.equal(workspace().text, '  Pressure is still low  ', 'failed delivery retains the draft');
  assert.equal(workspace().sentMessageId, null);
  assert.equal(calls.length, 1);
  confirmed = { id: 'confirmed-message' };
  await workspace().send();
  assert.deepEqual(calls[0], ['/reports/owned-report/messages', { text: 'Pressure is still low' }]);
  assert.deepEqual(calls[1], calls[0], 'uncertain retry resubmits the same report and message');
  assert.equal(workspace().text, '');
  assert.equal(workspace().sentMessageId, 'confirmed-message');
  assert.equal(calls[2], 'reload');
});

test('conversation reconciles measured layout after programmatic momentum while preserving deliberate readers', () => {
  const messages = [{ id: 'old', text: 'Earlier', authorRole: 'customer', createdAt: '2026-10-23T00:00:00Z' }];
  const workspace = { resource: { data: { messages } }, text: 'retained draft', setText() {},
    message: { busy: false, locked: false, uncertain: false, error: null }, sentMessageId: null, send() {} };
  const runtime = screenRuntime('features/reports/components/report-conversation.tsx', {
    '../hooks/report-workspace': { useReportWorkspace: () => workspace },
    'react-native': { View: 'View', Text: 'Text', ScrollView: 'ScrollView' },
  });
  const render = () => runtime.render('ReportConversation');
  const feedOf = tree => nodes(tree, 'ScrollView')[0];
  let tree = render();
  const scrolls = [];
  feedOf(tree).props.ref.current = { scrollTo: options => scrolls.push(options) };
  runtime.flushEffects();
  const position = (y, height = 2000, viewport = 500) => ({ nativeEvent: { contentSize: { height }, contentOffset: { y }, layoutMeasurement: { height: viewport } } });
  feedOf(tree).props.onLayout({ nativeEvent: { layout: { height: 500 } } });
  feedOf(tree).props.onContentSizeChange(300, 2000);
  scrolls.length = 0;
  feedOf(tree).props.onScrollBeginDrag();
  feedOf(tree).props.onScroll(position(100));
  feedOf(tree).props.onScrollEndDrag(position(100));
  workspace.resource.data.messages = [...messages, { id: 'incoming', text: 'Incoming', authorRole: 'staff', createdAt: '2026-10-23T00:00:30Z' }];
  tree = render(); runtime.flushEffects();
  feedOf(tree).props.onContentSizeChange(300, 2050);
  assert.equal(scrolls.length, 0, 'incoming fetched growth preserves a reader who deliberately scrolled away');
  workspace.sentMessageId = 'confirmed-message';
  tree = render(); runtime.flushEffects();
  feedOf(tree).props.onContentSizeChange(300, 2050);
  assert.equal(scrolls.length, 0, 'command confirmation waits until the sent message is in fetched content');
  workspace.resource.data.messages = [...workspace.resource.data.messages, { id: 'confirmed-message', text: 'Newest own reply', authorRole: 'customer', createdAt: '2026-10-23T00:01:00Z' }];
  tree = render(); runtime.flushEffects();
  assert.equal(scrolls.at(-1).y, 1550);
  feedOf(tree).props.onMomentumScrollBegin();
  feedOf(tree).props.onScroll(position(100));
  feedOf(tree).props.onMomentumScrollEnd(position(100));
  feedOf(tree).props.onContentSizeChange(300, 2300);
  assert.equal(scrolls.at(-1).y, 1800, 'programmatic momentum without a drag cannot disable following new content');
  feedOf(tree).props.onScroll(position(1200, 2300));
  assert.equal(scrolls.at(-1).y, 1800, 'clamped or stale native offsets are reconciled against measured content');
  feedOf(tree).props.onLayout({ nativeEvent: { layout: { height: 800 } } });
  const lastBubble = nodes(tree, 'View').filter(node => typeof node.props.onLayout === 'function').at(-1);
  lastBubble.props.onLayout();
  assert.equal(scrolls.at(-1).y, 1500, 'keyboard-close viewport growth computes a new exact endpoint');
  assert.ok(scrolls.every(options => options.animated === false), 'stale animated targets cannot race later layout');
  const count = scrolls.length;
  feedOf(tree).props.onScrollBeginDrag();
  feedOf(tree).props.onScrollEndDrag(position(100, 2300, 800));
  feedOf(tree).props.onContentSizeChange(300, 2500);
  assert.equal(scrolls.length, count, 'a real reader gesture releases following after own send');
  workspace.message.uncertain = true; workspace.message.locked = true;
  tree = render();
  assert.equal(control(tree, 'Field', 'Message to the supplier').editable, false);
  assert.equal(control(tree, 'Button', 'Retry same message').disabled, false);
  assert.equal(control(tree, 'Field', 'Message to the supplier').value, 'retained draft');
});

test('authoritative layout survives the captured delayed native scroll geometry after own send', () => {
  const runtime = screenRuntime('features/reports/components/report-conversation.tsx', {
    '../hooks/report-workspace': { useReportWorkspace: () => ({ resource: { data: { messages: [
      { id: 'confirmed', text: 'Newest reply', authorRole: 'customer', createdAt: '2026-10-23T00:00:00Z' },
    ] } }, text: '', setText() {}, message: {}, sentMessageId: 'confirmed', send() {} }) },
    'react-native': { View: 'View', Text: 'Text', ScrollView: 'ScrollView' },
  });
  const tree = runtime.render('ReportConversation');
  const feed = nodes(tree, 'ScrollView')[0];
  const scrolls = [];
  feed.props.ref.current = { scrollTo: options => scrolls.push(options) };
  runtime.flushEffects();
  const viewport = 292.19049072265625, content = 3746.666748046875;
  feed.props.onLayout({ nativeEvent: { layout: { height: viewport } } });
  feed.props.onContentSizeChange(380, content);
  const requested = scrolls.length;
  feed.props.onScroll({ nativeEvent: { contentSize: { height: 3630.09521484375 },
    layoutMeasurement: { height: 204.1904754638672 }, contentOffset: { y: 3425.90478515625 } } });
  assert.equal(scrolls.length, requested + 1, 'a delayed old scroll event still needs correction to the newest measured endpoint');
  assert.equal(scrolls.at(-1).y, content - viewport, 'native onScroll must not replace newer authoritative layout dimensions');
  const reconciled = scrolls.length;
  feed.props.onScroll({ nativeEvent: { contentSize: { height: 3630.09521484375 },
    layoutMeasurement: { height: 0 }, contentOffset: { y: 3425.90478515625 } } });
  assert.equal(scrolls.length, reconciled + 1, 'the captured transient zero native viewport must not disable authoritative layout correction');
  assert.equal(scrolls.at(-1).y, content - viewport);
  feed.props.onScroll({ nativeEvent: { contentSize: { height: content },
    layoutMeasurement: { height: viewport }, contentOffset: { y: content - viewport } } });
  const acknowledged = scrolls.length;
  feed.props.onScroll({ nativeEvent: { contentSize: { height: 3630.09521484375 },
    layoutMeasurement: { height: 0 }, contentOffset: { y: 3425.90478515625 } } });
  assert.equal(scrolls.length, acknowledged + 1, 'a stale native event forces latest-layout alignment even after the cached target was acknowledged');
  assert.equal(scrolls.at(-1).y, content - viewport);
  feed.props.onScrollBeginDrag();
  feed.props.onScrollEndDrag({ nativeEvent: { contentSize: { height: content },
    layoutMeasurement: { height: viewport }, contentOffset: { y: 100 } } });
  const reading = scrolls.length;
  feed.props.onContentSizeChange(380, content + 100);
  assert.equal(scrolls.length, reading, 'authoritative geometry must not override deliberate older-reader position');
});
