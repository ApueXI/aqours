import assert from 'node:assert/strict';
import {expect, type Locator, type Page} from '@playwright/test';
import type {ApprovedGuidance, Connection, Guidance, Report, RuleVersion, TimelineEvent, User} from '../aqours-contracts/src/index.ts';
import {fixturePassword, key, login, ok, type Actor} from './harness.ts';

type Passed = (message: string) => void;
const section = (page: Page, title: string) => page.locator('section').filter({has: page.getByRole('heading', {name: title, exact: true})}).last();
async function submit<T>(page: Page, scope: Locator, name: string, endpoint: string, method = 'POST'): Promise<T> {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(endpoint) && r.request().method() === method),
    scope.getByRole('button', {name, exact: true}).click(),
  ]);
  assert.equal(response.status(), 200, `${method} ${endpoint}`);
  return (await response.json()).data as T;
}
async function findEdit(page: Page, label: string) {
  const edit = page.getByRole('button', {name: label, exact: true});
  while (await edit.count() === 0) {
    const next = page.getByRole('button', {name: 'Next', exact: true});
    assert.ok(await next.isEnabled(), `Missing fixture ${label}`);
    const response = page.waitForResponse(r => r.url().includes('/staff/settings/') && r.request().method() === 'GET');
    await next.click(); await response;
    await expect(page.getByText('Loading…', {exact: true})).toHaveCount(0);
  }
  await edit.click();
}
export async function accountConnectionFlows(page: Page, web: string, admin: Actor, passed: Passed) {
  const suffix = key(), name = `Fictional recovery customer ${suffix}`;
  const user = await ok<User>(admin, 'POST', '/staff/settings/accounts', {
    email: `recovery-${suffix}@demo.aqours.test`, name, password: fixturePassword, role: 'customer',
  });
  await page.goto(`${web}/#/settings`);
  await expect(page.getByRole('heading', {name: 'Accounts', exact: true})).toBeVisible();
  await expect(page.getByText('Loading…', {exact: true})).toHaveCount(0);
  await findEdit(page, `Edit ${name}`);
  const edit = section(page, `Edit ${name}`), revised = `${name} maintained`;
  await edit.getByLabel('Name', {exact: true}).fill(revised);
  await edit.getByLabel('Phone', {exact: true}).fill('Fictional contact only');
  await edit.getByLabel('Change reason', {exact: true}).fill('Fictional browser account maintenance');
  const changed = await submit<User>(page, edit, 'Save account', `/staff/settings/accounts/${user.id}`, 'PATCH');
  assert.equal(changed.name, revised); assert.equal(changed.version, user.version + 1);
  assert.ok(!JSON.stringify(changed).includes('password'));
  await expect(page.getByRole('button', {name: `Edit ${revised}`, exact: true})).toBeVisible();
  passed('BR-SET-01 Browser account maintenance persists safe fictional identity fields');
  const customer = await login(user.email);
  await page.getByRole('button', {name: 'Connections', exact: true}).click();
  await page.locator('summary').filter({hasText: /^Create service connection$/}).click();
  const create = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create service connection$/})});
  await expect(create.getByLabel('Customer', {exact: true}).locator(`option[value="${user.id}"]`)).toHaveCount(1);
  await create.getByLabel('Customer', {exact: true}).selectOption(user.id);
  const reference = `RECOVERY-${suffix}`;
  await create.getByLabel('Connection reference', {exact: true}).fill(reference);
  await create.getByLabel('Saved service address', {exact: true}).fill('Fictional recovery courtyard, address only');
  const connection = await submit<Connection>(page, create, 'Create connection', '/staff/settings/connections');
  assert.equal(connection.zoneId, null); assert.equal(connection.zoneConfirmed, false);
  assert.equal(connection.latitude, null); assert.equal(connection.longitude, null);
  const reportPayload = {connectionId: connection.id, category: 'outage', description: 'Fictional browser recovery location fixture', noticedAt: new Date().toISOString()};
  const unlocated = await ok<Report>(customer, 'POST', '/reports', reportPayload);
  await page.getByRole('button', {name: 'Refresh connections', exact: true}).click();
  await expect(page.getByText('Loading…', {exact: true})).toHaveCount(0);
  await findEdit(page, `Edit ${reference}`);
  const connectionEdit = section(page, `Edit ${reference}`);
  await connectionEdit.getByLabel('Saved service address', {exact: true}).fill('Fictional revised recovery courtyard');
  await connectionEdit.getByLabel('Latitude (optional)', {exact: true}).fill('14.6');
  await connectionEdit.getByLabel('Longitude (optional)', {exact: true}).fill('121');
  await connectionEdit.getByLabel('Location / association correction reason', {exact: true}).fill('Fictional explicit location correction, zone still unknown');
  const updated = await submit<Connection>(page, connectionEdit, 'Save connection', `/staff/settings/connections/${connection.id}`, 'PATCH');
  assert.equal(updated.zoneId, null); assert.equal(updated.zoneConfirmed, false);
  const original = await ok<Report>(customer, 'GET', `/reports/${unlocated.id}`);
  assert.equal(original.address, connection.address); assert.equal(original.latitude, null); assert.equal(original.zoneId, null);
  const located = await ok<Report>(customer, 'POST', '/reports', reportPayload);
  assert.equal(located.latitude, 14.6); assert.equal(located.longitude, 121); assert.equal(located.zoneId, null);
  assert.equal(located.locationReview, true);
  const audit = await ok<(TimelineEvent & {targetId: string})[]>(admin, 'GET', '/staff/audit?limit=100');
  assert.ok(audit.some(e => e.targetId === connection.id && e.action === 'connection_updated' && e.actorId === admin.user.id && e.createdAt));
  passed('BR-SET-02 Browser connection create/edit preserves unknown zones and old report snapshots');
  return {customer, unlocated, located};
}
export async function versionFlows(page: Page, web: string, admin: Actor, customer: Actor, report: Report, passed: Passed) {
  const rulesBefore = await ok<RuleVersion[]>(admin, 'GET', '/staff/settings/rules');
  const original = rulesBefore.find(r => r.active)!;
  const guidanceBefore = await ok<ApprovedGuidance[]>(admin, 'GET', '/staff/settings/guidance');
  const prior = [...guidanceBefore].sort((a, b) => b.version - a.version)[0]!;
  const evaluation = await ok<Guidance>(customer, 'POST', `/reports/${report.id}/guidance`, {});
  const noticesBefore = await ok<unknown[]>(admin, 'GET', '/staff/advisories?limit=100');
  let ruleChanged = false, guidanceChanged = false;
  try {
    await page.goto(`${web}/#/settings`);
    await page.getByRole('button', {name: 'Guidance', exact: true}).click();
    await expect(page.getByText('Loading…', {exact: true})).toHaveCount(0);
    await page.locator('summary').filter({hasText: /^Create and activate rule version$/}).click();
    const rules = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create and activate rule version$/})});
    const label = ` Fictional browser version ${key()}`;
    await rules.getByLabel('Callback recommendation explanation', {exact: true}).fill(original.contactText + label);
    ruleChanged = true;
    const revised = await submit<RuleVersion>(page, rules, 'Activate new rule version', '/staff/settings/rules');
    await expect(page.getByRole('heading', {name: `Version ${revised.version} · Active`, exact: true})).toBeVisible();
    await expect(page.getByRole('heading', {name: `Version ${original.version} · Historical`, exact: true})).toBeVisible();
    const history = await ok<RuleVersion[]>(admin, 'GET', '/staff/settings/rules');
    assert.deepEqual(history.find(r => r.id === original.id), {...original, active: false});
    assert.equal((await ok<Guidance>(customer, 'GET', `/guidance/${evaluation.id}`)).current, false);
    const fresh = await ok<Guidance>(customer, 'POST', `/reports/${report.id}/guidance`, {});
    assert.equal(fresh.ruleVersion, revised.version); assert.equal(fresh.current, true);
    assert.ok(fresh.cards.some(c => c.reason.includes(label.trim())));
    passed('BR-SET-03 Browser rule activation preserves history and invalidates prior API recommendations');
    await page.locator('summary').filter({hasText: /^Add approved guidance version$/}).click();
    const guidance = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Add approved guidance version$/})});
    await guidance.getByLabel('Guidance type', {exact: true}).selectOption(prior.kind);
    await guidance.getByLabel('Approved instructions', {exact: true}).fill(prior.text + label);
    await guidance.getByLabel('Approved source / reference', {exact: true}).fill(`Fictional browser verification; ${prior.source}`);
    guidanceChanged = true;
    const added = await submit<ApprovedGuidance>(page, guidance, 'Create guidance version', '/staff/settings/guidance');
    await expect(page.getByText(added.text, {exact: true})).toBeVisible();
    const all = await ok<ApprovedGuidance[]>(admin, 'GET', '/staff/settings/guidance');
    for (const old of guidanceBefore) assert.deepEqual(all.find(g => g.id === old.id), old);
    const audit = await ok<(TimelineEvent & {targetId: string})[]>(admin, 'GET', '/staff/audit?limit=100');
    for (const id of [revised.id, added.id]) assert.ok(audit.some(e => e.targetId === id && e.actorId === admin.user.id && e.createdAt));
    assert.deepEqual(await ok<unknown[]>(admin, 'GET', '/staff/advisories?limit=100'), noticesBefore);
    passed('BR-SET-04 Browser guidance creation preserves exact versions/audit without publishing notices');
  } finally {
    if (guidanceChanged) await ok(admin, 'POST', '/staff/settings/guidance', {kind: prior.kind, text: prior.text, source: prior.source});
    if (ruleChanged) await ok(admin, 'POST', '/staff/settings/rules', {contactText: original.contactText, inspectionText: original.inspectionText, waterText: original.waterText});
    const restored = (await ok<RuleVersion[]>(admin, 'GET', '/staff/settings/rules')).find(r => r.active)!;
    assert.equal(restored.contactText, original.contactText); assert.equal(restored.inspectionText, original.inspectionText); assert.equal(restored.waterText, original.waterText);
    const restoredGuidance = (await ok<ApprovedGuidance[]>(admin, 'GET', '/staff/settings/guidance')).filter(g => g.kind === prior.kind).sort((a, b) => b.version - a.version)[0];
    assert.equal(restoredGuidance.text, prior.text); assert.equal(restoredGuidance.source, prior.source);
  }
}
