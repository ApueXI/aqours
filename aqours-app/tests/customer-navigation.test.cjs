const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { screenRuntime, nodes } = require('./mobile-ui-runtime.cjs');

test('customer tab navigator presents five named destinations and keeps public route URLs', () => {
  const runtime = screenRuntime('app/(customer)/(tabs)/_layout.tsx');
  const tree = runtime.render('default');
  const screens = nodes(tree, 'TabScreen');
  assert.deepEqual(screens.filter(item => item.props.options.href !== null).map(item => item.props.options.title), ['Home', 'Reports', 'Messages', 'Weather', 'Settings']);
  assert.deepEqual(screens.filter(item => item.props.options.href !== null).map(item => item.props.options.tabBarAccessibilityLabel), ['Home tab', 'Reports tab', 'Messages tab', 'Weather tab', 'Settings tab']);
  const routeRoot = path.join(__dirname, '../src/app/(customer)');
  const urls = fs.readdirSync(routeRoot, { recursive: true }).filter(file => file.endsWith('.tsx') && !file.endsWith('_layout.tsx'))
    .map(file => '/' + file.replaceAll(path.sep, '/').split('/').filter(segment => !segment.startsWith('(')).join('/').replace(/\.tsx$/, '').replace(/(^|\/)index$/, ''));
  for (const url of ['/', '/reports', '/reports/new', '/reports/[id]', '/reports/[id]/messages', '/reports/[id]/guidance', '/assistance', '/assistance/new', '/assistance/[id]', '/notifications', '/messages', '/weather', '/service', '/profile', '/advisories/[id]', '/incidents/[id]']) {
    assert.ok(urls.includes(url), `Existing public route ${url} remains available`);
  }
});

test('authenticated navigator mounts no private routes during session loading or after sign-out', () => {
  const session = { user: null, loading: true };
  const runtime = screenRuntime('app/(customer)/_layout.tsx', { '@/features/auth/hooks/session': { useSession: () => session } });
  assert.equal(runtime.render('default').type, 'Screen');
  session.loading = false;
  let tree = runtime.render('default');
  assert.equal(tree.type, 'Redirect');
  assert.equal(tree.props.href, '/login');
  session.user = { id: 'customer-a' };
  tree = runtime.render('default');
  assert.equal(String(tree.type), 'Stack');
  assert.equal(tree.key, 'customer-a');
  assert.equal(nodes(tree, 'StackScreen')[0].props.name, '(tabs)');
  session.user = { id: 'customer-b' };
  assert.equal(runtime.render('default').key, 'customer-b', 'account change remounts private route state');
});

test('native and header back return to the previous form step, while uncertain commands stay locked', () => {
  const runtime = screenRuntime('components/form-back.tsx');
  let previous = 0;
  let routed = 0;
  runtime.router.back = () => routed++;
  runtime.router.canGoBack = () => true;
  let tree = runtime.render('FormBack', { previous: () => previous++, locked: false, fallback: '/reports' });
  assert.equal(runtime.nativeBack(), true);
  assert.equal(previous, 1);
  tree.props.options.headerLeft().props.onPress();
  assert.equal(previous, 2);
  assert.equal(routed, 0);
  tree = runtime.render('FormBack', { previous: () => previous++, locked: true, fallback: '/reports' });
  assert.equal(runtime.nativeBack(), true);
  assert.equal(tree.props.options.headerLeft().props.disabled, true);
  assert.equal(previous, 2);
  tree = runtime.render('FormBack', { locked: false, fallback: '/reports' });
  assert.equal(runtime.nativeBack(), false);
  tree.props.options.headerLeft().props.onPress();
  assert.equal(routed, 1);
});


test('all five Android tab glyphs fit their native boxes at large text while labels remain readable and scalable', () => {
  for (const fontScale of [1, 1.3]) {
    const runtime = screenRuntime('app/(customer)/(tabs)/_layout.tsx', {
      'react-native': { Text: 'Text', Platform: { OS: 'android' },
        useWindowDimensions: () => ({ width: 412, height: 732, scale: 2.625, fontScale }) },
    });
    const tree = runtime.render('default');
    assert.ok(tree.props.screenOptions.tabBarItemStyle.minHeight >= 48);
    for (const screen of nodes(tree, 'TabScreen').filter(item => item.props.options.href !== null)) {
      const icon = screen.props.options.tabBarIcon({ color: '#147d77' });
      assert.ok(icon.props.size * fontScale <= icon.props.style.height + 0.01,
        `${screen.props.options.title} glyph must not be clipped by its native box at scale ${fontScale}`);
      const label = screen.props.options.tabBarLabel({ color: '#147d77' });
      assert.equal(label.props.children, screen.props.options.title);
      assert.notEqual(label.props.allowFontScaling, false, 'tab captions retain the customer text-scale setting');
      assert.ok(screen.props.options.tabBarAccessibilityLabel.includes(screen.props.options.title));
    }
  }
});
