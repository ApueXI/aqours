import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium, expect, type Page} from '@playwright/test';
import type {Advisory, AssistanceRequest, Attachment, Guidance, Report, ReportDetail} from '../aqours-contracts/src/index.ts';
import {base, connection, fixturePassword, key, login, ok, origin} from './harness.ts';

// Supplier actions use the real browser; customer presentation assertions here are API-only.
const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/evidence');
const temporary = path.resolve('.cache/tmp');
const results: string[] = [];
const passed = (name: string) => {results.push(`PASS ${name}`); console.log('PASS', name);};
const displayTime = (value: string) => new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));
async function submit(page: Page, name: string, endpoint: string, method = 'POST') {
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname.endsWith(endpoint) && r.request().method() === method),
    page.getByRole('button', {name, exact: true}).click(),
  ]);
  assert.equal(response.status(), 200, `${method} ${endpoint}`);
  return (await response.json()).data;
}

await Promise.all([mkdir(output, {recursive: true}), mkdir(temporary, {recursive: true})]);
const customer = await login('customer11@demo.aqours.test');
const staff = await login('staff@demo.aqours.test', 'web');
const existingNotices = await ok<Advisory[]>(customer, 'GET', '/advisories?limit=100');
assert.equal(existingNotices.filter(n => ['boil_water', 'do_not_drink', 'do_not_use'].includes(n.kind)).length, 0,
  'This isolated unknown-safety scenario needs a customer without current quality restrictions');
const item = await ok<Report>(customer, 'POST', '/reports', {
  connectionId: (await connection(customer)).id, category: 'water_quality',
  description: `Fictional isolated water-quality observation ${key()}`,
  noticedAt: new Date().toISOString(),
  answers: {details: 'Fictional unusual appearance and odor; reported hazard needs prompt supplier review. No safety diagnosis.'},
  location: {address: 'Fictional quality issue address awaiting review', source: 'geocoded_address', confirmed: false},
});
const form = new FormData();
const filename = 'fictional-quality-one-pixel.png';
form.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqkAAAAASUVORK5CYII=', 'base64')], {type: 'image/png'}), filename);
const upload = await fetch(`${base}/reports/${item.id}/attachments`, {
  method: 'POST', headers: {Origin: origin, Authorization: `Bearer ${customer.token}`, 'Idempotency-Key': key()}, body: form,
});
assert.equal(upload.status, 200);
const attachment = (await upload.json() as {data: Attachment}).data;
const context = await chromium.launchPersistentContext(path.resolve('.local/browser-quality-profile'), {
  executablePath: '/usr/bin/chromium', headless: true, viewport: {width: 1440, height: 1100},
  env: {...process.env, TMPDIR: temporary}, args: ['--no-sandbox'],
});
await context.clearCookies();
const page = await context.newPage(), errors: string[] = [];
page.setDefaultTimeout(15000);
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(web);
  await page.getByLabel('Email', {exact: true}).fill('staff@demo.aqours.test');
  await page.getByLabel('Password', {exact: true}).fill(fixturePassword);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Overview', exact: true})).toBeVisible();
  await page.goto(`${web}/#/reports?category=water_quality`);
  const row = page.getByRole('row').filter({has: page.getByRole('link', {name: item.reference, exact: true})});
  await expect(row).toContainText('Water quality');
  await expect(row).toContainText('Unlocated');
  await row.getByRole('link', {name: item.reference, exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Water quality · Received', exact: true})).toBeVisible();
  await expect(page.getByText(/Additional issue details: Fictional unusual appearance and odor/)).toBeVisible();
  await expect(page.getByText('This report is not linked to an incident.', {exact: true})).toBeVisible();
  passed('BQ1 Water-quality inbox/detail expose the isolated category and customer-reported hazard for staff review');

  const photo = page.locator('article.attachment').filter({hasText: filename});
  await photo.getByRole('button', {name: 'Open protected image', exact: true}).click();
  const image = photo.getByRole('img', {name: `Report attachment: ${filename}`, exact: true});
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth === 1)).toBe(true);
  assert.match(await image.getAttribute('src') ?? '', /^blob:/);
  assert.doesNotMatch(await page.locator('main').innerText(), /water is safe to drink|confirmed contamination/i);
  assert.equal((await ok<Report>(customer, 'GET', `/reports/${item.id}`)).status, 'received');
  await page.screenshot({path: path.join(output, 'browser-quality-review.png'), fullPage: true});
  passed('BQ2 Staff opens the protected quality photo as an observation without a generated safety diagnosis');

  const message = 'Fictional acknowledgement: supplier review requested; appearance/photo cannot establish water safety.';
  await page.getByLabel('Customer-visible message', {exact: true}).fill(message);
  await submit(page, 'Send to customer', `/staff/reports/${item.id}/messages`);
  await expect(page.getByRole('article').getByText(message, {exact: true})).toBeVisible();
  const reason = 'Fictional urgent isolated quality concern: review reported hazard; no contamination/drinkability conclusion.';
  await page.getByLabel('Status', {exact: true}).selectOption('under_review');
  await page.getByLabel('Assigned owner', {exact: true}).selectOption(staff.user.id);
  await page.getByLabel('Priority', {exact: true}).selectOption('urgent');
  const reasonField = page.getByLabel('Review / priority / closure reason', {exact: true});
  await expect(reasonField).toHaveAttribute('required', '');
  await page.getByRole('button', {name: 'Save review', exact: true}).click();
  assert.equal(await reasonField.evaluate((node: HTMLTextAreaElement) => node.validity.valueMissing), true);
  assert.equal((await ok<Report>(customer, 'GET', `/reports/${item.id}`)).priority, 'normal');
  await reasonField.fill(reason);
  await submit(page, 'Save review', `/staff/reports/${item.id}`, 'PATCH');
  const reviewed = await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`);
  assert.equal(reviewed.priority, 'urgent'); assert.equal(reviewed.priorityReason, reason);
  assert.equal(reviewed.ownerId, staff.user.id); assert.equal(reviewed.status, 'under_review');
  const event = reviewed.timeline.find(e => e.action === 'reviewed' && e.text === reason)!;
  assert.ok(event); assert.equal(event.actorId, staff.user.id); assert.ok(Number.isFinite(Date.parse(event.createdAt)));
  await expect(page.locator('.history li').filter({hasText: reason})).toContainText(displayTime(event.createdAt));
  await page.screenshot({path: path.join(output, 'browser-quality-prioritized.png'), fullPage: true});
  passed('BQ3 Browser requires a reason then acknowledges, assigns and prioritizes quality review with persisted actor/time history');

  for (const field of ['latitude', 'longitude', 'zoneId', 'incidentId'] as const) assert.equal(reviewed[field], null);
  assert.equal(reviewed.zoneConfirmed, false); assert.equal(reviewed.locationConfirmed, false);
  assert.equal(reviewed.firstResolvedAt, null); assert.ok(reviewed.firstRespondedAt);
  assert.ok(reviewed.messages.some(m => m.text === message && m.authorId === staff.user.id));
  assert.ok(reviewed.attachments.some(a => a.id === attachment.id));
  for (const field of ['notes', 'customer', 'suggestions', 'answers']) assert.equal(field in reviewed, false);
  await expect(page.getByText(/No coordinates/)).toBeVisible();
  await expect(page.getByText(/Unknown zone/)).toBeVisible();
  passed('BQ4 Customer-safe quality detail/timeline retain acknowledgement and attachment without invented location or automatic resolution');

  const privateNote = `Fictional internal quality review only ${key()}`;
  await page.getByLabel('Internal note', {exact: true}).fill(privateNote);
  await submit(page, 'Add internal note', `/staff/reports/${item.id}/notes`);
  await expect(page.getByRole('article').getByText(privateNote, {exact: true})).toBeVisible();
  assert.ok(!JSON.stringify(await ok(customer, 'GET', `/reports/${item.id}`)).includes(privateNote));
  const assistanceBefore = await ok<AssistanceRequest[]>(customer, 'GET', '/assistance-requests?limit=100');
  const guide = await ok<Guidance>(customer, 'POST', `/reports/${item.id}/guidance`, {answers: {hazard: true, needsWater: true, nearbyAffected: 'unknown'}});
  const approved = await ok<{id: string; kind: string; text: string; source: string; version: number}[]>(staff, 'GET', '/staff/settings/guidance');
  const latest = approved.filter(a => a.kind === 'general').sort((a, b) => b.version - a.version)[0];
  assert.ok(latest);
  const approvedCard = guide.cards.find(c => c.sourceType === 'guidance' && c.sourceId === latest.id)!;
  assert.ok(approvedCard); assert.equal(approvedCard.reason, latest.text); assert.equal(approvedCard.source, latest.source);
  assert.equal(approvedCard.sourceVersion, latest.version);
  assert.ok(guide.cards.some(c => c.action === 'callback')); assert.ok(guide.cards.some(c => c.action === 'escalation'));
  assert.ok(guide.uncertainty.some(s => s.includes('photographs cannot determine water safety')));
  assert.ok(guide.uncertainty.some(s => s.includes('zone is unconfirmed')));
  assert.ok(guide.uncertainty.some(s => s.includes('No eligible pickup availability')));
  assert.ok(guide.cards.every(c => c.reason && c.source && Number.isFinite(Date.parse(c.updatedAt))));
  assert.equal(guide.current, true); assert.ok(guide.sourceSignature); assert.ok(guide.ruleVersion >= 1);
  assert.doesNotMatch(JSON.stringify(guide), /water is safe to drink|confirmed contamination|guaranteed water availability/i);
  assert.equal('evidence' in guide, false); assert.equal('answers' in guide, false);
  passed('BQ5 Customer API guidance retains exact approved source/version, callback and hazard escalation with explicit safety/location/availability uncertainty');

  await ok(customer, 'POST', `/guidance/${guide.id}/choice`, {action: 'callback'});
  assert.deepEqual(await ok(customer, 'GET', '/assistance-requests?limit=100'), assistanceBefore);
  const afterChoice = await ok<ReportDetail>(customer, 'GET', `/reports/${item.id}`);
  assert.equal(afterChoice.status, 'under_review'); assert.equal(afterChoice.version, reviewed.version);
  assert.deepEqual(await ok(customer, 'GET', '/advisories?limit=100'), existingNotices);
  await page.goto(`${web}/#/advisories`);
  await expect(page.getByText('Staff can read advisories. An administrator manages publication, revisions, and lifting.', {exact: true})).toBeVisible();
  await expect(page.getByText('Create advisory draft', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('button', {name: /^(Publish|Confirm publish|Lift) advisory$/})).toHaveCount(0);
  await page.screenshot({path: path.join(output, 'browser-quality-publication-boundary.png'), fullPage: true});
  passed('BQ6 Quality review and callback choice neither publish official notices nor submit assistance or transition the report automatically');
  assert.deepEqual(errors, []);
  await page.getByRole('button', {name: 'Sign out', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Sign in', exact: true})).toBeVisible();
  passed('BQ7 Quality browser run has no uncaught exceptions and staff explicitly signs out');
} catch (error) {
  results.push(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  await page.screenshot({path: path.join(output, 'browser-quality-failure.png'), fullPage: true});
  throw error;
} finally {
  await writeFile(path.join(output, 'browser-quality-results.txt'), results.join('\n') + '\n');
  await writeFile(path.join(output, 'browser-quality-results.json'), JSON.stringify({
    reportId: item.id, reference: item.reference, attachmentId: attachment.id,
    customerFixture: 'customer11', supplierActions: 'actual Chromium', customerAssertions: 'HTTP API only',
    results, completedAt: new Date().toISOString(),
  }, null, 2) + '\n');
  await context.close();
  await Promise.allSettled([ok(customer, 'POST', '/auth/logout', {}), ok(staff, 'POST', '/auth/logout', {})]);
}
