require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { protectedImageSources } = require('../src/features/reports/utils/protected-image.ts');

// Execute the actual pinned RN Android source-to-native-props branch, without
// loading Android native views in Node or substituting hand-written header logic.
const source = fs.readFileSync(path.join(__dirname, '../node_modules/react-native/Libraries/Image/Image.android.js'), 'utf8');
const start = source.indexOf('  if (Array.isArray(source_)) {');
const end = source.indexOf('\n  if (onLoadStart != null)', start);
assert.ok(start >= 0 && end > start, 'Pinned RN Android image source branch must be identifiable');
const branch = source.slice(start, end);
function nativeProps(source_) {
  const context = { source_, nativeProps: {}, styles: { base: {} }, style: {}, width: undefined, height: undefined };
  vm.runInNewContext(branch, context);
  return context.nativeProps;
}

test('installed RN Android object-image branch drops the old source authorization header', () => {
  const props = nativeProps({ uri: 'https://fixture.invalid/attachments/owned', headers: { Authorization: 'Bearer fictional-test-token' } });
  assert.equal(props.headers, undefined);
});

test('protected image builder forwards credentials and reload policy through installed RN Android image branch', () => {
  const uri = 'https://fixture.invalid/attachments/owned';
  const sources = protectedImageSources(uri, 'fictional-test-token');
  const props = nativeProps(sources);
  assert.equal(props.headers.Authorization, 'Bearer fictional-test-token');
  assert.equal(props.source, sources);
  assert.equal(props.source[0].uri, uri);
  assert.equal(props.source[0].cache, 'reload');
  assert.equal(new URL(uri).search, '');
});

test('missing mobile session never creates a literal null bearer credential for an image', () => {
  assert.equal(nativeProps(protectedImageSources('https://fixture.invalid/attachments/owned', null)).headers, undefined);
});
