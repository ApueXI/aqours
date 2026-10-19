const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const appRoot = path.resolve(__dirname, '..');
const photoUri = 'file:///fictional/cache/picker-cache.png';
const photoBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 255]);

function loadModule(relativePath, dependencies = {}, globals = {}) {
  const filename = path.join(appRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const exports = {};
  vm.runInNewContext(compiled.outputText, {
    exports, Blob, TextEncoder, Uint8Array, ArrayBuffer, URLSearchParams, ReadableStream,
    require: (name) => {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  }, { filename });
  return exports;
}

function sdkHarness() {
  // Only the native File object and RN's storage shell are doubled. The Expo
  // FormData patch, multipart converter, body normalizer and app builder are real.
  class NativeFileDouble {
    constructor(uri) {
      if (uri !== photoUri) throw new Error('Invalid native file');
      this.uri = uri;
    }
    get name() { return 'picker-cache.png'; }
    get type() { return 'image/png'; }
    async bytes() { return photoBytes.slice(); }
  }
  class NativeFormDataDouble {
    constructor() { this._parts = []; }
  }
  const globals = { FormData: NativeFormDataDouble };
  const { installFormDataPatch } = loadModule('node_modules/expo/src/winter/FormData.ts', {}, globals);
  installFormDataPatch(NativeFormDataDouble);
  const blobUtils = {
    blobToArrayBufferAsync: () => { throw new Error('Native File must use bytes(), not Blob conversion'); },
  };
  const converter = loadModule('node_modules/expo/src/winter/fetch/convertFormData.ts', {
    '../../utils/blobUtils': blobUtils,
  }, globals);
  const normalizer = loadModule('node_modules/expo/src/winter/fetch/RequestUtils.ts', {
    './convertFormData': converter,
    '../../utils/blobUtils': blobUtils,
  }, globals);
  const builder = loadModule('src/lib/photo-upload.ts', {
    'expo-file-system': { File: NativeFileDouble },
  }, globals);
  return { ...builder, ...converter, ...normalizer, FormData: NativeFormDataDouble };
}

test('installed Expo 57 converter rejects the previous React Native URI descriptor', async () => {
  const sdk = sdkHarness();
  const body = new sdk.FormData();
  body.append('file', { uri: photoUri, name: 'friendly-photo.png', type: 'image/png' });
  await assert.rejects(sdk.convertFormDataAsync(body), /Unsupported FormDataPart implementation/);
});

test('production photo builder passes file bytes, name and type through installed Expo multipart conversion', async () => {
  const sdk = sdkHarness();
  const body = sdk.createPhotoUploadBody(photoUri);
  const file = body.get('file');
  assert.equal(file instanceof Blob, false, 'Expo File need not extend global Blob');
  const normalized = await sdk.normalizeBodyInitAsync(body);
  const header = normalized.overriddenHeaders.find(([name]) => name === 'Content-Type')[1];
  assert.match(header, /^multipart\/form-data; boundary=----ExpoFetchFormBoundary/);
  const boundary = header.split('boundary=')[1];
  const expected = Buffer.concat([
    Buffer.from(`--${boundary}\r\ncontent-disposition: form-data; name="file"; filename="picker-cache.png"\r\ncontent-type: image/png\r\n\r\n`),
    Buffer.from(photoBytes),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  assert.deepEqual(Buffer.from(normalized.body), expected);
});

test('uncertain photo retry retains its original file body and key with repeatable Expo multipart bytes', async () => {
  const sdk = sdkHarness();
  const { acquireIntention } = loadModule('src/lib/operations.ts');
  const body = sdk.createPhotoUploadBody(photoUri);
  const first = acquireIntention('fictional-customer', '/reports/owned/attachments', body, 'POST', () => 'first-key', photoUri);
  // No finishIntention occurs after an uncertain response, matching useCommand.
  const retry = acquireIntention('fictional-customer', '/reports/owned/attachments', sdk.createPhotoUploadBody(photoUri), 'POST', () => 'unexpected-key', photoUri);
  assert.equal(retry.intention.key, 'first-key');
  assert.equal(retry.intention.body, first.intention.body);
  assert.equal(retry.intention.body.get('file'), body.get('file'));
  const initialBytes = await sdk.convertFormDataAsync(first.intention.body, 'retry-fixture');
  const retryBytes = await sdk.convertFormDataAsync(retry.intention.body, 'retry-fixture');
  assert.deepEqual(Buffer.from(retryBytes.body), Buffer.from(initialBytes.body));
});

test('native file preparation failure is raised before an upload body is returned', () => {
  const sdk = sdkHarness();
  assert.throws(() => sdk.createPhotoUploadBody('invalid-file'), /Invalid native file/);
});
