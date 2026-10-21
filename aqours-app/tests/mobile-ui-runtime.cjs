const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the screen and its real domain helpers, replacing native views/hooks only.
// This exercises event handlers and rerenders without a new test dependency.
function screenRuntime(entry, overrides = {}) {
  let cursor = 0;
  const state = [];
  const cache = new Map();
  let nativeBack;
  const router = { canGoBack: () => false, back: () => {}, replace: () => {}, push: () => {} };
  const ui = Object.fromEntries(['Body', 'Button', 'Choices', 'Demo', 'ErrorNotice', 'Field', 'Loading', 'Screen', 'Section'].map(name => [name, name]));
  Object.assign(ui, { colors: {}, styles: {}, navigate: () => {} });
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useReducer(reducer, initial, initialize) {
      const index = cursor++;
      if (!(index in state)) state[index] = initialize ? initialize(initial) : initial;
      return [state[index], action => { state[index] = reducer(state[index], action); }];
    },
    useCallback: callback => callback,
  };
  const defaults = {
    react,
    'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', BackHandler: { addEventListener: (_event, handler) => { nativeBack = handler; return { remove() {} }; } } },
    'expo-router': { router, Stack: Object.assign('Stack', { Screen: 'StackScreen' }), Tabs: Object.assign('Tabs', { Screen: 'TabScreen' }),
      Redirect: 'Redirect', useFocusEffect: effect => effect(), useLocalSearchParams: () => ({ reportId: 'owned-report' }) },
    'expo-symbols': { SymbolView: 'SymbolView' },
    '@/components/ui': ui, './ui': ui,
    '@/components/form-back': { FormBack: 'FormBack' },
    '@/components/resource-state': { ResourceState: 'ResourceState' },
    '@/features/auth/hooks/session': { useSession: () => ({ user: { id: 'customer-a', phone: '09990000001' } }) },
    '@/features/location/components/location-picker': { LocationPicker: 'LocationPicker' },
    '../components/photos': { PhotoPicker: 'PhotoPicker', PhotoUpload: 'PhotoUpload' },
    '../components/report-progress': { ReportProgress: 'ReportProgress' },
    '../components/report-review': { ReportReview: 'ReportReview' },
    '../components/pickup-options': { PickupOptions: 'PickupOptions' },
    '../components/assistance-summary': { AssistanceSummary: 'AssistanceSummary', assistanceNames: { callback: 'Callback / support', inspection: 'Site inspection', water_support: 'Water pickup' } },
  };
  const dependencies = { ...defaults, ...overrides };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    function dependency(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      if (id.startsWith('.') || id.startsWith('@/')) {
        const stem = id.startsWith('@/') ? path.resolve(__dirname, '../src', id.slice(2)) : path.resolve(path.dirname(filename), id);
        const target = ['.ts', '.tsx'].map(extension => stem + extension).find(fs.existsSync);
        if (target) return load(target);
      }
      return require(id);
    }
    vm.runInThisContext(`(function(require, module, exports) { ${compiled.outputText}\n})`, { filename })(dependency, module, module.exports);
    cache.set(filename, module.exports);
    return module.exports;
  }
  const exports = load(path.resolve(__dirname, '../src', entry));
  return { exports, router, state, nativeBack: () => nativeBack?.(), render(name, props) { cursor = 0; return exports[name](props); } };
}

function nodes(tree, type) {
  const found = [];
  function visit(node) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== 'object') return;
    if (node.type === type) found.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return found;
}
function control(tree, type, name) {
  const node = nodes(tree, type).find(item => item.props.title === name || item.props.label === name);
  if (!node) throw new Error(`Missing ${type}: ${name}`);
  return node.props;
}
module.exports = { screenRuntime, nodes, control };
