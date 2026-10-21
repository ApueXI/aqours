const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Run the actual wrapper, renderer and style modules with native views replaced.
// Every MapLibre dependency access throws in Expo Go, including during import.
function previewRuntime(expoGo) {
  const loaded = [];
  const headers = [];
  const cache = new Map();
  let failed = false;
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    loaded.push(path.basename(filename));
    const module = { exports: {} };
    cache.set(filename, module.exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    function dependency(id) {
      if (id === 'expo') return { isRunningInExpoGo: () => expoGo };
      if (id === '@/components/ui') return { Body: 'Body', Button: 'Button' };
      if (id === '@/services/http-client') return { mapStyleUrl: '' };
      if (id === 'react') return { useState: () => [failed, (value) => { failed = value; }] };
      if (id === 'react-native') return { View: 'View', Text: 'Text', Linking: {} };
      if (id === '@maplibre/maplibre-react-native') {
        assert.equal(expoGo, false, 'Expo Go must never evaluate MapLibre');
        return { Map: 'Map', Camera: 'Camera', GeoJSONSource: 'GeoJSONSource', Layer: 'Layer',
          TransformRequestManager: { addHeader: (header) => headers.push(header) } };
      }
      if (id.startsWith('.')) {
        const stem = path.resolve(path.dirname(filename), id);
        const target = ['.tsx', '.ts'].map((extension) => stem + extension).find(fs.existsSync);
        assert.ok(target, `Resolve application dependency ${id}`);
        return load(target);
      }
      return require(id);
    }
    vm.runInThisContext(`(function(require, module, exports) { ${compiled.outputText}\n})`, { filename })(dependency, module, module.exports);
    return module.exports;
  }
  const { MapPreview } = load(path.join(__dirname, '../src/features/location/components/map-preview.native.tsx'));
  return { MapPreview, loaded, headers };
}

const coordinates = { latitude: 14.5995, longitude: 120.9842 };

test('Expo Go imports and renders coordinates without evaluating native map or style modules', () => {
  const runtime = previewRuntime(true);
  for (const point of [coordinates, { latitude: 0, longitude: -73.5 }]) {
    const result = runtime.MapPreview(point);
    assert.equal(result.type, 'Body');
    const text = result.props.children.join('');
    assert.match(text, /unavailable in Expo Go/);
    assert.ok(text.includes(`Latitude: ${point.latitude}, longitude: ${point.longitude}`));
    assert.match(text, /Aqours Android build/);
  }
  assert.deepEqual(runtime.loaded, ['map-preview.native.tsx']);
  assert.equal(runtime.headers.length, 0);
});

test('Aqours builds load the native renderer with the original point, camera and attribution', () => {
  const runtime = previewRuntime(false);
  assert.deepEqual(runtime.loaded, ['map-preview.native.tsx']);
  const component = runtime.MapPreview(coordinates);
  assert.deepEqual(component.props, coordinates);
  const rendered = component.type(component.props);
  const map = rendered.props.children[0];
  assert.equal(map.type, 'Map');
  assert.equal(map.props.attribution, true);
  const [camera, source] = map.props.children;
  assert.deepEqual(camera.props.initialViewState, { center: [coordinates.longitude, coordinates.latitude], zoom: 15 });
  assert.deepEqual(source.props.data, { type: 'Point', coordinates: [coordinates.longitude, coordinates.latitude] });
  assert.equal(source.props.children.type, 'Layer');
  assert.equal(runtime.headers[0].name, 'User-Agent');
  assert.match(runtime.headers[0].value, /Aqours/);
});

test('native map loading failure retains the address fallback and a working retry', () => {
  const { MapPreview } = previewRuntime(false);
  const component = MapPreview(coordinates);
  let rendered = component.type(component.props);
  rendered.props.children[0].props.onDidFailLoadingMap();
  rendered = component.type(component.props);
  const [message, retry] = rendered.props.children;
  assert.match(message.props.children, /continue with an address only/);
  assert.equal(retry.props.title, 'Retry map');
  retry.props.onPress();
  rendered = component.type(component.props);
  assert.equal(rendered.props.children[0].type, 'Map');
});
