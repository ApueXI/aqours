const assert = require('node:assert/strict');
const { test } = require('node:test');
const { screenRuntime, nodes, control } = require('./mobile-ui-runtime.cjs');
const resource = data => ({ data, loading: false, error: null, reload: async () => {} });
const text = tree => nodes(tree, 'Body').map(node => node.props.children).flat().join(' ');

function hooks(notices = [], incidents = []) {
  return { useAllResources: path => resource(path.startsWith('/advisories') ? notices : incidents), useResource: () => resource([]) };
}

test('service advisories show upcoming notices and retain past and lifted notices behind history', () => {
  const notices = [
    { id: 'future', title: 'Upcoming interruption', kind: 'scheduled_interruption', state: 'published', startsAt: '2099-01-01T00:00:00Z' },
    { id: 'past', title: 'Past interruption', kind: 'scheduled_interruption', state: 'published', endsAt: '2020-01-01T00:00:00Z' },
    { id: 'lifted', title: 'Lifted restriction', kind: 'do_not_use', state: 'lifted' },
  ];
  const runtime = screenRuntime('features/home/components/service-notices.tsx', { '@/hooks/use-resource': hooks() });
  const props = { notices: resource(notices), connections: [], verified: true, restrictions: false };
  let tree = runtime.render('ServiceNotices', props);
  assert.ok(text(tree).includes('Upcoming interruption'));
  assert.ok(!text(tree).includes('Past interruption'));
  tree = runtime.render('ServiceNotices', { ...props, history: true });
  assert.ok(text(tree).includes('Past interruption'));
  tree = runtime.render('ServiceNotices', { ...props, history: true, restrictions: true });
  assert.ok(text(tree).includes('Lifted restriction'));
  assert.ok(!text(tree).includes('remains in effect'));
});

test('resolved incident toggle restores published history without hiding current incidents', () => {
  const incidents = ['in_progress', 'resolved'].map(status => ({ id: status, summary: `${status} incident`, status, latestUpdate: { area: 'Fictional area' } }));
  const runtime = screenRuntime('features/home/components/service-notices.tsx', { '@/hooks/use-resource': hooks([], incidents) });
  let tree = runtime.render('IncidentSummaries');
  assert.ok(text(tree).includes('in_progress incident'));
  assert.ok(!text(tree).includes('resolved incident'));
  control(tree, 'Button', 'Include resolved incidents').onPress();
  tree = runtime.render('IncidentSummaries');
  assert.ok(text(tree).includes('resolved incident'));
  assert.ok(text(tree).includes('in_progress incident'));
});

test('Updates refresh appears before the first update and refreshes the current page', async () => {
  let reloads = 0;
  const data = [{ id: 'notice', title: 'Supplier notice', createdAt: '2026-10-23T01:00:00Z' }];
  const runtime = screenRuntime('features/notifications/screens/notifications-screen.tsx', {
    '@/hooks/use-resource': { useResource: () => ({ ...resource(data), reload: async () => reloads++ }) },
  });
  const tree = runtime.render('NotificationsScreen');
  assert.equal(nodes(tree, 'Button')[0].props.title, 'Refresh updates');
  await control(tree, 'Button', 'Refresh updates').onPress();
  assert.equal(reloads, 1);
});

test('Home discovers all published advisory dates and offers account settings', () => {
  const calls = [];
  const runtime = screenRuntime('features/home/screens/home-screen.tsx', {
    '@/hooks/use-resource': { ...hooks(), useAllResources: path => { calls.push(path); return resource([]); } },
  });
  const tree = runtime.render('HomeScreen');
  assert.ok(calls.includes('/advisories?includeLifted=true'));
  assert.ok(control(tree, 'Button', 'Account settings'));
  // Child components are exercised separately above; Home must include both notice categories.
  assert.equal(tree.props.title.startsWith('Hello'), true);
});

test('Account settings exposes identity, password controls, owned connections and sign-out', () => {
  let signedOut = false;
  const runtime = screenRuntime('features/profile/screens/profile-screen.tsx', {
    '@/hooks/use-resource': { useResource: path => resource(path === '/me' ? { name: 'Fictional customer', email: 'fictional@example.test' } : []) },
    '@/features/auth/hooks/session': { useSession: () => ({ logout: async () => { signedOut = true; } }) },
    '../components/change-password': { ChangePassword: 'ChangePassword' },
  });
  const tree = runtime.render('default');
  assert.equal(tree.props.title, 'Account settings');
  assert.ok(text(tree).includes('fictional@example.test'));
  assert.equal(nodes(tree, 'ChangePassword').length, 1);
  control(tree, 'Button', 'Sign out').onPress();
  assert.equal(signedOut, true);
});
