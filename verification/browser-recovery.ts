import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, expect} from '@playwright/test';
import type {MapResponse, Metrics, Report, User} from '../aqours-contracts/src/index.ts';
import {fixturePassword, key, login, ok, request, type Actor} from './harness.ts';
import {accountConnectionFlows, versionFlows} from './browser-settings.ts';

const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/evidence'), temporary = path.resolve('.cache/tmp');
await Promise.all([mkdir(output, {recursive: true}), mkdir(temporary, {recursive: true})]);
const context = await chromium.launchPersistentContext(path.resolve('.local/browser-recovery-profile'), {
  executablePath: '/usr/bin/chromium', headless: true, viewport: {width: 1440, height: 1000},
  env: {...process.env, TMPDIR: temporary},
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
await context.clearCookies();
const page = await context.newPage();
page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000);
const evidence: string[] = [], errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
function passed(message: string) { evidence.push(message); console.log('PASS', message); }
async function credentials(email: string, password: string) {
  await page.getByLabel('Email', {exact: true}).fill(email);
  await page.getByLabel('Password', {exact: true}).fill(password);
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/auth/login')),
    page.getByRole('button', {name: 'Sign in', exact: true}).click(),
  ]);
  return response;
}
async function emptyMetrics() {
  await page.goto(`${web}/#/overview`);
  await expect(page.getByRole('heading', {name: 'Overview', exact: true})).toBeVisible();
  await page.getByLabel('Category', {exact: true}).selectOption('outage');
  await page.locator('summary').filter({hasText: /^More filters/}).click();
  await page.getByLabel('Status', {exact: true}).selectOption('received');
  await page.getByLabel('Submitted from (Manila)', {exact: true}).fill('2090-01-01T00:00');
  await page.getByLabel('Submitted before (Manila)', {exact: true}).fill('2090-01-02T00:00');
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/staff/metrics?')),
    page.getByRole('button', {name: 'Apply filters', exact: true}).click(),
  ]);
  const metrics = (await response.json()).data as Metrics;
  assert.equal(response.status(), 200); assert.equal(metrics.reportCount, 0); assert.equal(metrics.uniqueConnections, 0);
  await page.getByText('Report measures and cohort definitions', {exact: true}).click();
  await expect(page.getByRole('row').filter({has: page.getByRole('cell', {name: 'Reports in selected cohort', exact: true})}).getByRole('cell', {name: '0', exact: true})).toBeVisible();
  await expect(page.getByRole('row').filter({has: page.getByRole('cell', {name: 'Unique reporting connections', exact: true})}).getByRole('cell', {name: '0', exact: true})).toBeVisible();
  assert.equal(metrics.firstResponse.meanSeconds, null); assert.equal(metrics.firstResolution.meanSeconds, null);
  await expect(page.getByRole('cell', {name: 'No completed sample', exact: true})).toHaveCount(2);
  await expect(page.getByText(/Asia\/Manila · As of/)).toBeVisible();
  const mapLink = page.getByRole('link', {name: 'View map', exact: true});
  const href = await mapLink.getAttribute('href');
  assert.ok(href?.includes('category=outage') && href.includes('status=received') && href.includes('from=') && href.includes('to='));
  passed('BR-DASH-01 Combined dashboard filters show genuine zero/null samples and retain drill-down filters');
  const asOf = await page.getByText(/Asia\/Manila · As of/).textContent();
  await page.route('**/api/v1/staff/metrics*', route => route.abort('failed'));
  await page.getByRole('button', {name: 'Refresh', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('Connection lost');
  await expect(page.getByText(/Stale results\. Last received/)).toBeVisible();
  assert.equal(await page.getByText(/Asia\/Manila · As of/).textContent(), asOf);
  await page.unroute('**/api/v1/staff/metrics*');
  await page.getByRole('button', {name: 'Retry loading', exact: true}).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/Stale results\. Last received/)).toHaveCount(0);
  passed('BR-DASH-02 Aborted metrics refresh preserves labeled stale counts/as-of and recovers');
}
async function mapFlows(unlocated: Report, located: Report) {
  await page.route('https://demotiles.maplibre.org/**', route => route.abort());
  await page.goto(`${web}/#/map`);
  await page.locator('details.map-filter-disclosure > summary').click();
  await page.locator('summary').filter({hasText: /^More filters/}).click();
  await page.getByLabel('Category', {exact: true}).selectOption('outage');
  await page.getByLabel('Status', {exact: true}).selectOption('received');
  await page.getByLabel('Submitted from (Manila)', {exact: true}).fill('2000-01-01T00:00');
  await page.getByLabel('Submitted before (Manila)', {exact: true}).fill('2100-01-01T00:00');
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/staff/map/reports?') && r.url().includes('category=outage')),
    page.getByRole('button', {name: 'Apply filters', exact: true}).click(),
  ]);
  const mapped = (await response.json()).data as MapResponse;
  const viewport = new URL(response.url()).searchParams;
  for (const key of ['west', 'east', 'south', 'north']) assert.ok(viewport.has(key));
  assert.equal(response.status(), 200);
  assert.ok(mapped.features.some(f => f.properties.id === located.id));
  assert.ok(!mapped.features.some(f => f.properties.id === unlocated.id));
  assert.ok(mapped.unlocatedCount > 0);
  for (const feature of mapped.features) {
    assert.equal(feature.properties.category, 'outage'); assert.equal(feature.properties.status, 'received');
    assert.ok(feature.geometry.coordinates[0] >= Number(viewport.get('west')) && feature.geometry.coordinates[0] <= Number(viewport.get('east')));
    assert.ok(feature.geometry.coordinates[1] >= Number(viewport.get('south')) && feature.geometry.coordinates[1] <= Number(viewport.get('north')));
  }
  const unlocatedOnly = page.getByLabel('Show only reports without coordinates', {exact: true});
  if (!await unlocatedOnly.isVisible()) await page.locator('details.map-filter-disclosure > summary').click();
  await unlocatedOnly.check();
  const row = page.getByRole('row').filter({has: page.getByRole('link', {name: unlocated.reference, exact: true})});
  await expect(row).toContainText('No coordinates');
  await expect(page.getByRole('link', {name: located.reference, exact: true})).toHaveCount(0);
  passed('BR-MAP-01 Unlocated reports remain reviewable without invented features under combined viewport filters');
  await row.getByRole('link', {name: unlocated.reference, exact: true}).click();
  await expect(page.getByRole('heading', {name: unlocated.reference, exact: true})).toBeVisible();
  await page.getByRole('link', {name: 'Back to inbox', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Report map', exact: true})).toBeVisible();
  await expect(page.getByLabel('Category', {exact: true})).toHaveValue('outage');
  await expect(page.getByLabel('Status', {exact: true})).toHaveValue('received');
  await expect(page.getByLabel('Submitted from (Manila)', {exact: true})).toHaveValue('2000-01-01T00:00');
  await expect(page.getByLabel('Submitted before (Manila)', {exact: true})).toHaveValue('2100-01-01T00:00');
  await page.getByRole('link', {name: 'Open inbox with filters', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Report inbox', exact: true})).toBeVisible();
  await expect(page.getByLabel('Category', {exact: true})).toHaveValue('outage');
  await expect(page.getByLabel('Status', {exact: true})).toHaveValue('received');
  passed('BR-MAP-02 Map/detail/inbox navigation retains applied category/status/period filters');
  await page.route('**/api/v1/staff/map/reports*', route => route.abort('failed'));
  await page.goto(`${web}/#/map?category=outage&status=received`);
  await expect(page.getByRole('alert').first()).toContainText('Connection lost');
  await expect(page.getByText('No mapped reports in this viewport. This does not establish normal supply or safe water.', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('link', {name: unlocated.reference, exact: true})).toBeVisible();
  await page.unroute('**/api/v1/staff/map/reports*');
  const recoveredResponse = page.waitForResponse(response => response.request().method() === 'GET' && response.url().includes('/staff/map/reports?'));
  await page.getByRole('button', {name: 'Refresh', exact: true}).click();
  const recovered = (await (await recoveredResponse).json()).data as MapResponse;
  await expect(page.getByRole('alert').filter({hasText: 'Connection lost'})).toHaveCount(0);
  const scopeCount = page.locator('.map-scope-count');
  await expect(scopeCount).toContainText(`${recovered.features.length} shown`);
  await expect(scopeCount).toContainText(`${recovered.unlocatedCount} unlocated`);
  passed('BR-MAP-03 Failed map query shows an error with usable list and recovers to actual results');
}
try {
  await page.route('**/api/v1/auth/session', route => route.abort('failed'));
  await page.goto(web);
  await expect(page.getByRole('heading', {name: 'Supplier sign in', exact: true})).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Connection lost');
  await expect(page.getByRole('navigation', {name: 'Main navigation'})).toHaveCount(0);
  await page.unroute('**/api/v1/auth/session');
  await page.getByRole('button', {name: 'Retry session check', exact: true}).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  passed('BR-AUTH-01 Unavailable session restore shows retry and never exposes protected workspace');
  const badPassword = 'FictionalWrongPassword2026!';
  for (const email of ['staff@demo.aqours.test', `absent-${key()}@demo.aqours.test`]) {
    assert.equal((await credentials(email, badPassword)).status(), 401);
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
    assert.ok(!(await page.locator('body').innerText()).includes(badPassword));
    await expect(page.getByRole('navigation', {name: 'Main navigation'})).toHaveCount(0);
  }
  passed('BR-AUTH-02 Existing/absent invalid logins show identical generic errors without password disclosure');
  await page.route('**/api/v1/auth/login', route => route.abort('failed'));
  await page.getByLabel('Email', {exact: true}).fill('admin@demo.aqours.test');
  await page.getByLabel('Password', {exact: true}).fill(fixturePassword);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('Connection lost');
  await expect(page.getByRole('heading', {name: 'Supplier sign in', exact: true})).toBeVisible();
  await page.unroute('**/api/v1/auth/login');
  const authResponse = await credentials('admin@demo.aqours.test', fixturePassword);
  assert.equal(authResponse.status(), 200);
  const session = (await authResponse.json()).data as {user: User; csrfToken: string};
  await expect(page.getByRole('heading', {name: 'Overview', exact: true})).toBeVisible();
  passed('BR-AUTH-03 Aborted login remains signed out and subsequent actual login recovers');
  const admin = await login('admin@demo.aqours.test', 'web');
  const fixtures = await accountConnectionFlows(page, web, admin, passed);
  await versionFlows(page, web, admin, fixtures.customer, fixtures.located, passed);
  await emptyMetrics();
  await mapFlows(fixtures.unlocated, fixtures.located);
  await page.screenshot({path: path.join(output, 'web-recovery-map.png'), fullPage: true});
  await page.route('**/api/v1/auth/logout', route => route.abort('failed'));
  await page.getByRole('button', {name: 'Sign out', exact: true}).click();
  await expect(page.locator('.identity').getByRole('alert')).toContainText('Connection lost');
  await expect(page.getByRole('navigation', {name: 'Main navigation'})).toBeVisible();
  const cookie = (await context.cookies()).find(c => c.name === 'aqours_session')!;
  const own: Actor = {user: session.user, cookie: `${cookie.name}=${cookie.value}`, csrfToken: session.csrfToken};
  assert.equal((await request(own, 'GET', '/auth/session')).status, 200);
  await page.unroute('**/api/v1/auth/logout');
  passed('BR-AUTH-04 Aborted logout retains protected state and live server session without claiming success');
  assert.equal((await request(own, 'POST', '/auth/logout', {})).status, 200);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Supplier sign in', exact: true})).toBeVisible();
  await expect(page.getByRole('navigation', {name: 'Main navigation'})).toHaveCount(0);
  assert.equal((await request(own, 'GET', '/staff/metrics')).status, 401);
  assert.equal((await request(own, 'POST', '/auth/logout', {})).status, 200);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Supplier sign in', exact: true})).toBeVisible();
  passed('BR-AUTH-05 Own server-revoked session cannot restore protected data and repeat logout stays safe');
  for (let count = 0; count < 14; count++) {
    const response = await credentials(`throttle-${key()}@demo.aqours.test`, badPassword);
    if (response.status() === 429) {
      await expect(page.getByRole('alert')).toHaveText('Too many attempts. Wait a moment and try again.');
      passed('BR-AUTH-06 Actual login throttling shows actionable generic browser feedback');
      console.log('LOGIN_THROTTLE_LAST_UTC', new Date().toISOString()); break;
    }
    assert.equal(response.status(), 401);
    assert.ok(count < 13, 'Real authentication throttle did not activate');
  }
  assert.deepEqual(errors, []);
  await page.screenshot({path: path.join(output, 'web-recovery-throttle.png'), fullPage: true});
} catch (error) {
  await page.screenshot({path: path.join(output, 'web-recovery-failure.png'), fullPage: true});
  await writeFile(path.join(output, 'web-recovery-failure.html'), await page.content());
  throw error;
} finally {
  await writeFile(path.join(output, 'browser-recovery-results.txt'), evidence.join('\n') + '\n');
  await context.close();
}
