import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, expect, type Locator, type Page} from '@playwright/test';
import type {AssistanceRequest, Notification, PickupSession, PickupSite, ReportDetail, StaffIncident, TimelineEvent, User, Zone} from '../aqours-contracts/src/index.ts';
import {connection, fixturePassword, key, login, ok, report, type Actor} from './harness.ts';

type Passed = (message: string) => void;
const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/evidence');
const temporary = path.resolve('.cache/tmp');
const minute = (instant: number) => new Date(instant + 8 * 3600000).toISOString().slice(0, 16);
const section = (page: Page, title: string) => page.locator('section').filter({has: page.getByRole('heading', {name: title, exact: true})}).last();
async function submit<T>(page: Page, scope: Page | Locator, name: string, endpoint: string, method = 'POST', status = 200): Promise<T> {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(endpoint) && r.request().method() === method),
    scope.getByRole('button', {name, exact: true}).click(),
  ]);
  assert.equal(response.status(), status, `${method} ${endpoint}`);
  return (await response.json()).data as T;
}
async function openInspection(page: Page, customer: Actor, admin: Actor, passed: Passed) {
  const item = await report(customer, 'low_pressure', 'Fictional maintenance inspection report');
  const details = {issueDetails: 'Fictional persistent low pressure', siteAddress: 'Fictional alternate inspection courtyard', preferredWindow: 'Tomorrow morning', accessInstructions: 'Fictional north gate; ask the caretaker'};
  const inspection = await ok<AssistanceRequest>(customer, 'POST', '/assistance-requests', {reportId: item.id, type: 'inspection', details});
  const staff = (await ok<User[]>(admin, 'GET', '/staff/users')).find(u => u.email === 'staff@demo.aqours.test')!;
  await page.goto(`${web}/#/assistance/${inspection.id}`);
  for (const value of Object.values(details)) await expect(page.getByText(value, {exact: true})).toBeVisible();
  await page.getByLabel('Assigned staff owner', {exact: true}).selectOption(staff.id);
  await submit(page, page, 'Mark accepted', `/staff/assistance-requests/${inspection.id}/transition`);
  await expect(page.getByRole('heading', {name: 'Inspection · Accepted', exact: true})).toBeVisible();
  await page.getByLabel('Next status', {exact: true}).selectOption('scheduled');
  const appointment = minute(Date.now() + 3600000);
  await page.getByLabel('Agreed appointment / pickup time (Manila)', {exact: true}).fill(appointment);
  await submit(page, page, 'Mark scheduled', `/staff/assistance-requests/${inspection.id}/transition`);
  await expect(page.getByRole('heading', {name: 'Inspection · Scheduled', exact: true})).toBeVisible();
  let owned = await ok<AssistanceRequest>(customer, 'GET', `/assistance-requests/${inspection.id}`);
  assert.equal(owned.ownerId, staff.id);
  assert.equal(owned.appointmentAt, new Date(`${appointment}:00+08:00`).toISOString());
  assert.deepEqual(owned.details, details);
  passed('Inspection browser acceptance and Manila scheduling preserve alternate site/access details');
  const privateNote = `Fictional supplier-only inspection note ${key()}`;
  await page.getByLabel('Internal note', {exact: true}).fill(privateNote);
  await submit(page, page, 'Add internal note', `/staff/assistance-requests/${inspection.id}/notes`);
  await expect(page.getByText(privateNote, {exact: true})).toBeVisible();
  await page.getByLabel('Next status', {exact: true}).selectOption('in_progress');
  await submit(page, page, 'Mark in progress', `/staff/assistance-requests/${inspection.id}/transition`);
  await expect(page.getByRole('heading', {name: 'Inspection · In progress', exact: true})).toBeVisible();
  await page.getByLabel('Next status', {exact: true}).selectOption('completed');
  const outcome = 'Fictional inspection findings: supplier follow-up required';
  const nextSteps = 'Keep the separate report open for supplier review';
  await page.getByLabel('Inspection findings / outcome', {exact: true}).fill(outcome);
  await page.getByLabel('Customer next steps', {exact: true}).fill(nextSteps);
  await submit(page, page, 'Mark completed', `/staff/assistance-requests/${inspection.id}/transition`);
  await expect(page.getByRole('heading', {name: 'Inspection · Completed', exact: true})).toBeVisible();
  owned = await ok<AssistanceRequest>(customer, 'GET', `/assistance-requests/${inspection.id}`);
  assert.equal(owned.outcome, outcome); assert.equal(owned.nextSteps, nextSteps);
  assert.deepEqual(owned.timeline?.map(e => e.action), ['requested', 'accepted', 'scheduled', 'in_progress', 'completed']);
  assert.ok(!JSON.stringify(owned).includes(privateNote));
  assert.equal((await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`)).status, 'received');
  passed('Inspection browser completion exposes findings/next steps, excludes private notes, and leaves report unresolved');
  return staff.id;
}
async function zoneMaintenance(page: Page, admin: Actor, passed: Passed) {
  const name = `Fictional maintenance zone ${key()}`;
  await page.goto(`${web}/#/settings`);
  await page.getByRole('button', {name: 'Zones', exact: true}).click();
  await page.locator('summary').filter({hasText: /^Create service zone$/}).click();
  const create = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create service zone$/})});
  await create.getByLabel('Unique zone code', {exact: true}).fill(`MAINT-${key()}`);
  await create.getByLabel('Zone name', {exact: true}).fill(name);
  await create.getByLabel('Fictional demonstration zone', {exact: true}).check();
  const zone = await submit<Zone>(page, create, 'Create service zone', '/staff/settings/zones');
  await expect(page.getByRole('button', {name: `Edit ${name}`, exact: true})).toBeVisible();
  const stale = await page.context().newPage();
  await stale.goto(`${web}/#/settings`);
  await stale.getByRole('button', {name: 'Zones', exact: true}).click();
  await stale.getByRole('button', {name: `Edit ${name}`, exact: true}).click();
  await page.getByRole('button', {name: `Edit ${name}`, exact: true}).click();
  const edit = section(page, `Edit ${name}`);
  const revised = `${name} revised`, reason = 'Fictional isolated display-boundary review';
  const boundary = {type: 'Polygon', coordinates: [[[120, 14], [120.1, 14], [120.1, 14.1], [120, 14]]]};
  await edit.getByLabel('Zone name', {exact: true}).fill(revised);
  await edit.getByLabel('Display boundary (optional)', {exact: true}).fill(JSON.stringify(boundary));
  await edit.getByLabel('Change reason', {exact: true}).fill(reason);
  const updated = await submit<Zone>(page, edit, 'Save service zone', `/staff/settings/zones/${zone.id}`, 'PATCH');
  assert.equal(updated.version, zone.version + 1); assert.deepEqual(updated.boundary, boundary);
  const audit = await ok<(TimelineEvent & {targetId: string})[]>(admin, 'GET', '/staff/audit?limit=100');
  assert.ok(audit.some(e => e.targetId === zone.id && e.action === 'zone_updated' && e.text === reason && e.actorId === admin.user.id && e.createdAt));
  passed('Administrator browser creates and version-edits an isolated display zone with actor/time audit');
  const staleEdit = section(stale, `Edit ${name}`);
  await staleEdit.getByLabel('Zone name', {exact: true}).fill(`${name} stale overwrite`);
  await staleEdit.getByLabel('Change reason', {exact: true}).fill('Fictional stale browser edit');
  await submit(stale, staleEdit, 'Save service zone', `/staff/settings/zones/${zone.id}`, 'PATCH', 409);
  await expect(staleEdit.getByRole('alert')).toContainText('Refresh this record');
  assert.equal((await ok<Zone[]>(admin, 'GET', '/staff/settings/zones')).find(z => z.id === zone.id)?.name, revised);
  await stale.close();
  passed('Stale browser administrative edit shows conflict and preserves the newer zone');
  await expect(page.getByRole('heading', {name: `Edit ${revised}`, exact: true})).toBeVisible();
  const current = section(page, `Edit ${revised}`), attempts: {body: string | null; key: string | undefined}[] = [];
  const routePattern = `**/api/v1/staff/settings/zones/${zone.id}`;
  await page.route(routePattern, async route => {
    attempts.push({body: route.request().postData(), key: route.request().headers()['idempotency-key']});
    if (attempts.length === 1) await route.abort('failed'); else await route.continue();
  });
  await current.getByLabel('Change reason', {exact: true}).fill('Fictional retry verification');
  await current.getByRole('button', {name: 'Save service zone', exact: true}).click();
  await expect(current.getByRole('alert')).toContainText('The action may have reached the server');
  assert.equal((await ok<Zone[]>(admin, 'GET', '/staff/settings/zones')).find(z => z.id === zone.id)?.version, updated.version);
  await submit(page, current, 'Retry original action', `/staff/settings/zones/${zone.id}`, 'PATCH');
  await page.unroute(routePattern);
  assert.equal(attempts.length, 2); assert.ok(attempts[0].key); assert.deepEqual(attempts[0], attempts[1]);
  assert.equal((await ok<Zone[]>(admin, 'GET', '/staff/settings/zones')).find(z => z.id === zone.id)?.version, updated.version + 1);
  passed('Aborted browser write shows uncertain result and retries its frozen body/key successfully');
}
async function distributionMaintenance(page: Page, customer: Actor, other: Actor, admin: Actor, ownerId: string, passed: Passed) {
  await page.goto(`${web}/#/distribution?tab=sites`);
  await page.locator('summary').filter({hasText: /^Create pickup site$/}).click();
  const createSite = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create pickup site$/})});
  const name = `Fictional maintenance site ${key()}`;
  await createSite.getByLabel('Pickup site name', {exact: true}).fill(name);
  await createSite.getByLabel('Full address', {exact: true}).fill('Fictional maintenance hall');
  await createSite.getByLabel('Site instructions', {exact: true}).fill('Fictional north entrance');
  await createSite.getByLabel('Fictional demonstration site', {exact: true}).check();
  const site = await submit<PickupSite>(page, createSite, 'Create pickup site', '/staff/pickup-sites');
  await page.getByRole('button', {name: `Manage pickup site ${name}`, exact: true}).click();
  const siteCard = page.locator('#pickup-site-editor');
  await siteCard.getByText('Edit pickup site', {exact: true}).click();
  await siteCard.getByLabel('Site instructions', {exact: true}).fill('Fictional revised entrance instructions');
  await siteCard.getByLabel('Change reason', {exact: true}).fill('Fictional isolated site correction');
  const edited = await submit<PickupSite>(page, siteCard, 'Save pickup site', `/staff/pickup-sites/${site.id}`, 'PATCH');
  assert.equal(edited.version, site.version + 1);
  await page.getByRole('navigation', {name: 'Distribution sections'}).getByRole('link', {name: 'Sessions', exact: true}).click();
  await page.locator('summary').filter({hasText: /^Create pickup session$/}).click();
  const createSession = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create pickup session$/})});
  const zoneId = (await connection(customer)).zoneId!;
  const zoneIds = [...new Set([zoneId, (await connection(other)).zoneId!])];
  await createSession.getByLabel('Pickup site', {exact: true}).selectOption(site.id);
  await createSession.getByLabel('Eligible service zones', {exact: true}).selectOption(zoneIds);
  const submittedZoneIds = await createSession.getByLabel('Eligible service zones', {exact: true}).evaluate((select: HTMLSelectElement) => Array.from(select.selectedOptions, option => option.value));
  assert.deepEqual([...submittedZoneIds].sort(), [...zoneIds].sort());
  await createSession.getByLabel('Opens (Manila)', {exact: true}).fill(minute(Date.now() - 600000));
  await createSession.getByLabel('Closes (Manila)', {exact: true}).fill(minute(Date.now() + 86400000));
  await createSession.getByLabel('Total stock (liters)', {exact: true}).fill('80.25');
  await createSession.getByLabel('Customer pickup instructions', {exact: true}).fill('Fictional maintenance pickup instructions');
  await createSession.getByLabel('Fictional demonstration session', {exact: true}).check();
  const session = await submit<PickupSession>(page, createSession, 'Create pickup session', '/staff/distribution/sessions');
  await page.getByRole('button', {name: `Manage session at ${name}`, exact: true}).click();
  const card = page.locator('article.session').filter({has: page.getByRole('heading', {name: `${name} · Open`, exact: true})});
  await card.getByText('Edit stock / schedule', {exact: true}).click();
  await card.getByLabel('Total stock (liters)', {exact: true}).fill('90.75');
  await card.getByLabel('Stock / schedule change reason', {exact: true}).fill('Fictional exact-decimal restock');
  await submit(page, card, 'Save pickup session', `/staff/distribution/sessions/${session.id}`, 'PATCH');
  const options = await ok<PickupSession[]>(customer, 'GET', '/pickup-sessions?limit=100');
  const visible = options.find(s => s.id === session.id)!;
  assert.equal(visible.totalLiters, '90.75'); assert.equal(visible.remainingLiters, '90.75'); assert.equal(visible.demo, true);
  assert.equal(visible.site.instructions, edited.instructions); assert.deepEqual(visible.zoneIds, submittedZoneIds);
  await expect(page.getByRole('row').filter({has: page.getByRole('button', {name: `Manage session at ${name}`, exact: true})}).getByRole('cell', {name: '90.75', exact: true})).toHaveCount(2);
  passed('Browser creates/edits isolated pickup site/session and customer sees labeled exact-decimal availability');
  const reservedReport = await report(customer), pendingReport = await report(other);
  const reserve = await ok<AssistanceRequest>(customer, 'POST', '/assistance-requests', {reportId: reservedReport.id, type: 'water_support', details: {sessionId: session.id, requestedLiters: '25.50'}});
  const pending = await ok<AssistanceRequest>(other, 'POST', '/assistance-requests', {reportId: pendingReport.id, type: 'water_support', details: {sessionId: session.id, requestedLiters: '10.25'}});
  await page.goto(`${web}/#/assistance/${reserve.id}`);
  await page.getByLabel('Assigned staff owner', {exact: true}).selectOption(ownerId);
  await submit(page, page, 'Mark accepted', `/staff/assistance-requests/${reserve.id}/transition`);
  await page.goto(`${web}/#/distribution?tab=sessions`);
  const stockRow = page.getByRole('row').filter({has: page.getByRole('button', {name: `Manage session at ${name}`, exact: true})});
  await expect(stockRow.getByRole('cell', {name: '25.50', exact: true})).toBeVisible();
  await expect(stockRow.getByRole('cell', {name: '65.25', exact: true})).toBeVisible();
  await stockRow.getByRole('button', {name: `Manage session at ${name}`, exact: true}).click();
  await card.getByText('Cancel session and arrange follow-up', {exact: true}).click();
  const reason = 'Fictional maintenance closure; contact support for alternative pickup';
  await card.getByLabel('Cancellation reason / customer follow-up', {exact: true}).fill(reason);
  await card.getByRole('button', {name: 'Cancel pickup session', exact: true}).click();
  await expect(card.getByRole('region', {name: 'Publication preview'})).toContainText('25.50 L currently reserved');
  await submit(page, card, 'Confirm cancel pickup session', `/staff/distribution/sessions/${session.id}/cancel`);
  for (const [actor, item] of [[customer, reserve], [other, pending]] as const) {
    const owned = await ok<AssistanceRequest>(actor, 'GET', `/assistance-requests/${item.id}`);
    assert.equal(owned.status, 'unavailable'); assert.equal(owned.reason, reason); assert.match(owned.nextSteps!, /support/);
    assert.equal(owned.session?.reservedLiters, '0.00'); assert.equal(owned.session?.collectedLiters, '0.00'); assert.equal(owned.session?.remainingLiters, '90.75');
    assert.equal(owned.allocation?.state ?? null, actor === customer ? 'released' : null);
    const notifications = await ok<Notification[]>(actor, 'GET', '/notifications?limit=100');
    assert.equal(notifications.filter(n => n.targetId === item.id && n.title === 'Pickup session cancelled').length, 1);
  }
  passed('Confirmed browser session cancellation releases exactly 25.50 liters and informs reserved/pending owners once');
}
async function associations(page: Page, customer: Actor, admin: Actor, passed: Passed) {
  const item = await report(customer, 'leak', 'Fictional association correction report');
  const incidents: StaffIncident[] = [];
  for (const suffix of ['initial', 'corrected']) incidents.push(await ok<StaffIncident>(admin, 'POST', '/staff/incidents', {category: 'leak', summary: `Fictional maintenance ${suffix} ${key()}`, zoneIds: [item.zoneId], area: 'Fictional maintenance area', demo: true}));
  await page.goto(`${web}/#/reports/${item.id}`);
  for (const incident of incidents) await expect(page.getByRole('link', {name: incident.summary, exact: true})).toBeVisible();
  assert.equal((await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`)).incidentId, null);
  for (const [index, incident] of incidents.entries()) {
    await page.getByLabel('Incident (choose none to unlink)', {exact: true}).selectOption(incident.id);
    await page.getByLabel('Reason for link / correction', {exact: true}).fill(`Fictional ${index ? 'corrected' : 'confirmed'} association`);
    await submit(page, page, 'Confirm association', `/staff/reports/${item.id}/link`);
    await expect.poll(async () => (await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`)).incidentId).toBe(incident.id);
    await expect(page.getByRole('link', {name: 'Open currently linked incident', exact: true})).toHaveAttribute('href', `#/incidents/${incident.id}`);
  }
  const owned = await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`);
  assert.deepEqual(owned.timeline.filter(e => e.action === 'incident_link').map(e => e.text), ['Fictional confirmed association', 'Fictional corrected association']);
  assert.equal(owned.reference, item.reference); assert.equal(owned.status, 'received');
  const audit = await ok<(TimelineEvent & {targetId: string; metadata: {oldIncidentId: string | null; newIncidentId: string}})[]>(admin, 'GET', '/staff/audit?limit=100');
  assert.ok(audit.some(e => e.targetId === item.id && e.metadata.oldIncidentId === incidents[0].id && e.metadata.newIncidentId === incidents[1].id && e.actorId === admin.user.id));
  passed('Browser reviews suggestions then confirms/corrects association while retaining customer history and old/new audit');
}

await Promise.all([mkdir(output, {recursive: true}), mkdir(temporary, {recursive: true})]);
const customer = await login('customer01@demo.aqours.test'), other = await login('customer02@demo.aqours.test'), admin = await login('admin@demo.aqours.test', 'web');
const context = await chromium.launchPersistentContext(path.resolve('.local/browser-maintenance-profile'), {executablePath: '/usr/bin/chromium', headless: true, viewport: {width: 1440, height: 1000}, env: {...process.env, TMPDIR: temporary}, args: ['--no-sandbox']});
await context.clearCookies();
const page = await context.newPage(), results: string[] = [], errors: string[] = [];
page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
const passed: Passed = message => {results.push(`PASS ${message}`); console.log('PASS', message);};
try {
  await page.goto(web);
  await page.getByLabel('Email', {exact: true}).fill('admin@demo.aqours.test');
  await page.getByLabel('Password', {exact: true}).fill(fixturePassword);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Overview', exact: true})).toBeVisible();
  const ownerId = await openInspection(page, customer, admin, passed);
  await zoneMaintenance(page, admin, passed);
  await distributionMaintenance(page, customer, other, admin, ownerId, passed);
  await associations(page, customer, admin, passed);
  assert.deepEqual(errors, []);
  await page.screenshot({path: path.join(output, 'browser-maintenance-final.png'), fullPage: true});
} catch (error) {
  results.push(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  await page.screenshot({path: path.join(output, 'browser-maintenance-failure.png'), fullPage: true});
  throw error;
} finally {
  await writeFile(path.join(output, 'browser-maintenance-results.txt'), results.join('\n') + '\n');
  await context.close();
}
