import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

test('PSGC coordinate generation reproduces checked-in bytes using project-local disposable inputs', () => {
  const root = path.resolve('.local/psgc-weather');
  mkdirSync(root, { recursive: true });
  const temporary = mkdtempSync(path.join(root, 'generation-'));
  const weather = path.join(temporary, 'weather');
  mkdirSync(weather);
  const source = path.resolve('psgc-address-data/weather');
  const inputs = ['build-coordinates.ts', 'source-coordinates.json', 'source-provinces.json', 'source-regions.json', 'ancestry-crosswalk.json', 'source-exclusions.json'];
  try {
    for (const input of inputs) copyFileSync(path.join(source, input), path.join(weather, input));
    symlinkSync(path.resolve('psgc-address-data/data'), path.join(temporary, 'data'), 'dir');
    execFileSync(process.execPath, ['--experimental-strip-types', path.join(weather, 'build-coordinates.ts')], {
      cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
    });
    for (const output of ['coordinates.json', 'coverage.json', 'metadata.json'])
      assert.deepEqual(readFileSync(path.join(weather, output)), readFileSync(path.join(source, output)), output);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
