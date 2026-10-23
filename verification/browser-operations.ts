import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, expect, type Locator, type Page} from '@playwright/test';
import type {Attachment, Report, ReportDetail, StaffIncident, Zone} from '../aqours-contracts/src/index.ts';
import {base, connection, denied, fixturePassword, key, login, ok, origin, type Actor} from './harness.ts';

const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/evidence');
const temporary = path.resolve('.cache/tmp');
const displayTime = (value: string) => new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short'}).format(new Date(value));
type Passed = (message: string) => void;
async function submit<T>(page: Page, scope: Page | Locator, name: string, endpoint: string, method = 'POST'): Promise<T> {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(endpoint) && r.request().method() === method),
    scope.getByRole('button', {name, exact: true}).click(),
  ]);
  assert.equal(response.status(), 200, `${method} ${endpoint}`);
  return (await response.json()).data as T;
}
async function createReport(actor: Actor, located: boolean) {
  return ok<Report>(actor, 'POST', '/reports', {
    connectionId: (await connection(actor)).id, category: 'leak',
    description: `Fictional operations ${located ? 'known-point' : 'unlocated'} concern ${key()}`,
    noticedAt: new Date().toISOString(),
    location: located
      ? {address: 'Fictional operations known point', source: 'gps', confirmed: true, latitude: 14.61, longitude: 121.02}
      : {address: 'Fictional operations address awaiting location review', source: 'geocoded_address', confirmed: false},
  });
}
async function inbox(page: Page, a: Actor, b: Actor, first: Report, second: Report, passed: Passed) {
  await page.goto(`${web}/#/reports`);
  for (const item of [first, second]) {
    const row = page.getByRole('row').filter({has: page.getByRole('link', {name: item.reference, exact: true})});
    await expect(row).toBeVisible();
    await expect(row).toContainText(item.address);
  }
  await expect(page.getByRole('row').filter({has: page.getByRole('link', {name: first.reference, exact: true})})).toContainText('Unlocated');
  for (const [actor, own, foreign] of [[a, first, second], [b, second, first]] as const) {
    const items = await ok<Report[]>(actor, 'GET', '/reports?limit=100');
    assert.ok(items.some(item => item.id === own.id));
    assert.ok(items.every(item => item.customerId === actor.user.id && item.id !== foreign.id));
    await denied(actor, 'GET', `/reports/${foreign.id}`);
  }
  assert.equal(first.latitude, null); assert.equal(first.longitude, null); assert.equal(first.zoneId, null);
  assert.equal(second.latitude, 14.61); assert.equal(second.longitude, 121.02);
  passed('Supplier inbox displays both new customer references while customer lists/details enforce ownership');
}
async function reviewUnlocated(page: Page, a: Actor, staff: Actor, item: Report, passed: Passed) {
  await page.goto(`${web}/#/reports/${item.id}`);
  const message = 'Fictional acknowledgement: location clarification requested';
  await page.getByRole('navigation', {name: 'Report views'}).getByRole('button', {name: /^Messages/}).click();
  await page.getByLabel('Customer-visible message', {exact: true}).fill(message);
  await submit(page, page, 'Send to customer', `/staff/reports/${item.id}/messages`);
  await expect(page.getByRole('article').getByText(message, {exact: true})).toBeVisible();
  const reason = 'Fictional severe isolated leak requires urgent review without fabricated location';
  await page.getByLabel('Status', {exact: true}).selectOption('under_review');
  await page.getByLabel('Assigned owner', {exact: true}).selectOption(staff.user.id);
  await page.getByLabel('Priority', {exact: true}).selectOption('urgent');
  await page.getByLabel('Review / priority / closure reason', {exact: true}).fill(reason);
  await submit(page, page, 'Save review', `/staff/reports/${item.id}`, 'PATCH');
  const owned = await ok<ReportDetail>(a, 'GET', `/reports/${item.id}`);
  assert.equal(owned.ownerId, staff.user.id); assert.equal(owned.priority, 'urgent'); assert.equal(owned.priorityReason, reason);
  assert.equal(owned.status, 'under_review'); assert.ok(owned.firstRespondedAt);
  assert.equal(owned.latitude, null); assert.equal(owned.longitude, null); assert.equal(owned.zoneId, null); assert.equal(owned.zoneConfirmed, false);
  assert.ok(owned.messages.some(m => m.text === message && m.authorId === staff.user.id));
  const event = owned.timeline.find(e => e.action === 'reviewed' && e.text === reason)!;
  assert.equal(event.actorId, staff.user.id); assert.ok(Number.isFinite(Date.parse(event.createdAt)));
  const history = page.locator('.history li').filter({hasText: reason});
  await page.getByRole('navigation', {name: 'Report views'}).getByRole('button', {name: 'History', exact: true}).click();
  await expect(history).toContainText(displayTime(event.createdAt));
  await page.getByRole('navigation', {name: 'Report views'}).getByRole('button', {name: 'Summary', exact: true}).click();
  await expect(page.getByText('No coordinates', {exact: false})).toBeVisible();
  await expect(page.getByText('Unknown zone', {exact: false})).toBeVisible();
  passed('Staff acknowledges/assigns urgent unlocated report with reason/time history and no invented zone or coordinates');
}
async function protectedPhoto(page: Page, a: Actor, b: Actor, item: Report, passed: Passed) {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqkAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  const filename = 'fictional-operations-one-pixel.png';
  form.append('file', new Blob([png], {type: 'image/png'}), filename);
  const upload = await fetch(`${base}/reports/${item.id}/attachments`, {method: 'POST', headers: {Origin: origin, Authorization: `Bearer ${a.token}`, 'Idempotency-Key': key()}, body: form});
  assert.equal(upload.status, 200);
  const attachment = (await upload.json() as {data: Attachment}).data;
  await denied(b, 'GET', `/attachments/${attachment.id}`); await denied(null, 'GET', `/attachments/${attachment.id}`);
  await page.goto(`${web}/#/reports/${item.id}`);
  await page.getByRole('button', {name: 'Refresh current record', exact: true}).click();
  const article = page.locator('article.attachment').filter({hasText: filename});
  const routePattern = `**/api/v1/attachments/${attachment.id}`;
  await page.route(routePattern, route => route.abort('failed'), {times: 1});
  await article.getByRole('button', {name: 'Open protected image', exact: true}).click();
  await expect(article.getByRole('alert')).toContainText('The service could not be reached');
  await expect(article.getByRole('img')).toHaveCount(0);
  await expect(article.getByRole('button', {name: 'Open protected image', exact: true})).toBeEnabled();
  passed('Aborted protected-photo download shows an honest error with no displayed image and a usable retry');
  const [download] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(`/attachments/${attachment.id}`)),
    article.getByRole('button', {name: 'Open protected image', exact: true}).click(),
  ]);
  assert.equal(download.status(), 200); assert.match(download.headers()['content-type'], /^image\//);
  assert.match(download.headers()['cache-control'], /private|no-store/);
  const image = article.getByRole('img', {name: `Report attachment: ${filename}`, exact: true});
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth === 1 && node.naturalHeight === 1)).toBe(true);
  assert.match(await image.getAttribute('src') ?? '', /^blob:/);
  await expect(article.getByRole('alert')).toHaveCount(0);
  await page.screenshot({path: path.join(output, 'browser-operations-protected-photo.png'), fullPage: true});
  passed('Staff browser retrieves/decodes the real protected fictional PNG; foreign and anonymous access remain denied');
}
async function incidentOperations(page: Page, staff: Actor, a: Actor, b: Actor, first: Report, second: Report, passed: Passed) {
  const zone = (await ok<Zone[]>(staff, 'GET', '/staff/zones')).find(z => z.active)!;
  const summary = `Fictional operations incident ${key()}`;
  await page.goto(`${web}/#/incidents`);
  await page.locator('summary').filter({hasText: /^Create incident$/}).click();
  const create = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Create incident$/})});
  await create.getByLabel('Category', {exact: true}).selectOption('leak');
  await create.getByLabel('Incident summary', {exact: true}).fill(summary);
  await create.getByLabel('Explicit affected zones', {exact: true}).selectOption(zone.id);
  await create.getByLabel('Affected area description', {exact: true}).fill('Fictional reviewed operations area');
  await create.getByLabel('Fictional demonstration incident', {exact: true}).check();
  const incident = await submit<StaffIncident>(page, create, 'Create incident', '/staff/incidents');
  assert.equal(incident.category, 'leak'); assert.equal(incident.status, 'investigating'); assert.equal(incident.restorationAt, null); assert.equal(incident.demo, true);
  assert.deepEqual(incident.zoneIds, [zone.id]);
  const row = page.getByRole('row').filter({has: page.getByRole('link', {name: summary, exact: true})});
  await expect(row).toContainText('Demonstration');
  await page.getByRole('link', {name: summary, exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Leak · Investigating', exact: true})).toBeVisible();
  const created = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${incident.id}`);
  assert.ok(created.timeline?.some(e => e.action === 'created' && e.actorId === staff.user.id && e.toStatus === 'investigating' && e.createdAt));
  passed('Staff browser creates a real demo incident with reviewed zone, unknown restoration and persisted creation history');
  await page.locator('summary').filter({hasText: /^Edit incident \/ workflow status$/}).click();
  const edit = page.locator('details').filter({has: page.locator('summary').filter({hasText: /^Edit incident \/ workflow status$/})});
  const reason = 'Fictional staff confirmation after operational assessment';
  await edit.getByLabel('Owner', {exact: true}).selectOption(staff.user.id);
  await edit.getByLabel('Status', {exact: true}).selectOption('confirmed');
  await edit.getByLabel('Restoration estimate (Manila)', {exact: true}).fill('');
  await edit.getByLabel('Estimated affected customers', {exact: true}).fill('17');
  await edit.getByLabel('Estimate basis / source', {exact: true}).fill('Fictional supplier reviewed estimate; independent of report totals');
  await edit.getByLabel('Change / corrective-transition reason', {exact: true}).fill(reason);
  await submit(page, edit, 'Save incident', `/staff/incidents/${incident.id}`, 'PATCH');
  await expect(page.getByRole('heading', {name: 'Leak · Confirmed', exact: true})).toBeVisible();
  const updated = await ok<StaffIncident & {estimateUpdatedAt: string}>(staff, 'GET', `/staff/incidents/${incident.id}`);
  assert.equal(updated.version, incident.version + 1); assert.equal(updated.ownerId, staff.user.id); assert.equal(updated.restorationAt, null);
  assert.equal(updated.estimatedAffected, 17); assert.match(updated.estimateBasis!, /Fictional supplier reviewed estimate/); assert.ok(updated.estimateUpdatedAt);
  assert.equal(updated.reportCount, 0); assert.equal(updated.uniqueConnections, 0);
  const event = updated.timeline!.find(e => e.text === reason)!;
  assert.equal(event.actorId, staff.user.id); assert.equal(event.fromStatus, 'investigating'); assert.equal(event.toStatus, 'confirmed');
  await page.getByRole('navigation', {name: 'Incident views'}).getByRole('button', {name: 'History', exact: true}).click();
  await expect(page.locator('.history li').filter({hasText: reason})).toContainText(displayTime(event.createdAt));
  await expect(page.locator('dt').filter({hasText: /^Restoration estimate$/}).locator('xpath=following-sibling::dd[1]')).toHaveText('Unknown');
  passed('Staff browser edits incident status/owner/estimate with reason/time history while restoration remains explicitly unknown');
  for (const item of [first, second]) {
    await page.goto(`${web}/#/reports/${item.id}`);
    await page.getByLabel('Incident (choose none to unlink)', {exact: true}).selectOption(incident.id);
    await page.getByLabel('Reason for link / correction', {exact: true}).fill(`Fictional deliberate association ${item.reference}`);
    await submit(page, page, 'Confirm association', `/staff/reports/${item.id}/link`);
    await expect(page.getByRole('link', {name: 'Open currently linked incident', exact: true})).toHaveAttribute('href', `#/incidents/${incident.id}`);
  }
  let current = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${incident.id}`);
  assert.equal(current.reportCount, 2); assert.equal(current.uniqueConnections, 2); assert.equal(current.estimatedAffected, 17);
  await page.goto(`${web}/#/incidents/${incident.id}`);
  for (const item of [first, second]) await expect(page.getByRole('link', {name: item.reference, exact: true})).toBeVisible();
  await page.goto(`${web}/#/reports/${first.id}`);
  await page.getByLabel('Incident (choose none to unlink)', {exact: true}).selectOption('');
  const reasonUnlink = 'Fictional separate issue review requires deliberate unlink';
  await page.getByLabel('Reason for link / correction', {exact: true}).fill(reasonUnlink);
  await submit(page, page, 'Confirm association', `/staff/reports/${first.id}/link`);
  await expect(page.getByText('This report is not linked to an incident.', {exact: true})).toBeVisible();
  for (const [actor, item] of [[a, first], [b, second]] as const) {
    const owned = await ok<ReportDetail>(actor, 'GET', `/reports/${item.id}`);
    assert.equal(owned.customerId, actor.user.id); assert.equal(owned.reference, item.reference);
    assert.equal(owned.incidentId, item === first ? null : incident.id);
    assert.equal(owned.status, item === first ? 'under_review' : 'received');
    assert.ok(owned.timeline.some(e => e.text === `Fictional deliberate association ${item.reference}`));
    if (item === first) {assert.ok(owned.timeline.some(e => e.text === reasonUnlink)); assert.equal(owned.attachments.length, 1); assert.equal(owned.messages.length, 1);}
  }
  current = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${incident.id}`);
  assert.equal(current.reportCount, 1); assert.equal(current.uniqueConnections, 1); assert.equal(current.estimatedAffected, 17);
  await page.goto(`${web}/#/incidents/${incident.id}`);
  await expect(page.getByRole('link', {name: second.reference, exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: first.reference, exact: true})).toHaveCount(0);
  passed('Browser links both owners then deliberately unlinks one while retaining report content/history and distinct counts/estimate');
}

await Promise.all([mkdir(output, {recursive: true}), mkdir(temporary, {recursive: true})]);
const a = await login('customer01@demo.aqours.test'), b = await login('customer02@demo.aqours.test'), staff = await login('staff@demo.aqours.test', 'web');
const first = await createReport(a, false), second = await createReport(b, true);
const context = await chromium.launchPersistentContext(path.resolve('.local/browser-operations-profile'), {executablePath: '/usr/bin/chromium', headless: true, viewport: {width: 1440, height: 1000}, env: {...process.env, TMPDIR: temporary}, args: ['--no-sandbox']});
await context.clearCookies();
const page = await context.newPage(), results: string[] = [], errors: string[] = [];
page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
const passed: Passed = message => {results.push(`PASS ${message}`); console.log('PASS', message);};
try {
  await page.goto(web);
  await page.getByLabel('Email', {exact: true}).fill('staff@demo.aqours.test');
  await page.getByLabel('Password', {exact: true}).fill(fixturePassword);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Overview', exact: true})).toBeVisible();
  await inbox(page, a, b, first, second, passed);
  await reviewUnlocated(page, a, staff, first, passed);
  await protectedPhoto(page, a, b, first, passed);
  await incidentOperations(page, staff, a, b, first, second, passed);
  assert.deepEqual(errors, []);
  await page.screenshot({path: path.join(output, 'browser-operations-final.png'), fullPage: true});
} catch (error) {
  results.push(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  await page.screenshot({path: path.join(output, 'browser-operations-failure.png'), fullPage: true});
  throw error;
} finally {
  await writeFile(path.join(output, 'browser-operations-results.txt'), results.join('\n') + '\n');
  await context.close();
}
