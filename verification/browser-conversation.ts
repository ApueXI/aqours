import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { fixturePassword, login, ok, report } from './harness.ts';
import type { ReportDetail } from '../aqours-contracts/src/index.ts';

const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/reference-ui/evidence/conversation');
await mkdir(output, { recursive: true });
const actor = await login('customer01@demo.aqours.test');
const admin = await login('admin@demo.aqours.test', 'web');
const item = await report(actor, 'low_pressure', 'Synthetic conversation navigation and recovery verification');
for (let index = 0; index < 24; index++) {
  await ok(actor, 'POST', `/reports/${item.id}/messages`, { text: `Earlier customer update ${index + 1}: water pressure remains low at the synthetic service address.` });
}
const context = await chromium.launchPersistentContext(path.join(output, 'profile'), {
  executablePath: '/usr/bin/chromium', headless: true, viewport: { width: 1440, height: 1000 },
  env: { ...process.env, TMPDIR: path.resolve('.local/reference-ui/tmp') }, args: ['--no-sandbox'],
});
await context.clearCookies();
const page = await context.newPage();
page.setDefaultTimeout(15000);
const evidence: string[] = [], errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
const passed = (text: string) => { evidence.push(text); console.log('PASS', text); };
try {
  await page.goto(web);
  await page.getByLabel('Email', { exact: true }).fill('staff@demo.aqours.test');
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.goto(`${web}/#/reports/${item.id}?returnTo=${encodeURIComponent('/reports?category=low_pressure&offset=0')}`);
  const views = page.getByRole('navigation', { name: 'Report views' });
  await expect(views.getByRole('button', { name: 'Summary', exact: true })).toHaveAttribute('aria-current', 'page');
  await views.getByRole('button', { name: /^Messages/ }).click();
  const field = page.getByLabel('Customer-visible message', { exact: true });
  const feed = page.getByRole('region', { name: 'Customer messages', exact: true });
  const bubbles = feed.locator('article.message-bubble');
  await expect(bubbles.first()).toContainText('Earlier customer update 1:');
  await expect(bubbles.last()).toContainText('Earlier customer update 24:');
  await expect.poll(() => bubbles.last().evaluate(node => {
    const bubble = node.getBoundingClientRect();
    const container = node.closest('.message-feed')!.getBoundingClientRect();
    return bubble.top >= container.top && bubble.bottom <= container.bottom + 1;
  })).toBe(true);
  await expect.poll(() => feed.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(80);
  await field.fill('Draft retained across the report views');
  const latest = await ok<ReportDetail>(admin, 'GET', `/staff/reports/${item.id}`);
  const reviewed = await ok<ReportDetail>(admin, 'PATCH', `/staff/reports/${item.id}`, { expectedVersion: latest.version, status: 'under_review', priority: 'urgent', reason: 'Synthetic concurrent review refresh' });
  await page.getByRole('button', { name: 'Refresh current record', exact: true }).click();
  await expect(page.getByLabel('Priority', { exact: true })).toHaveValue('urgent');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('under_review');
  await expect(field).toHaveValue('Draft retained across the report views');
  await page.getByLabel('Review / priority / closure reason', { exact: true }).fill('Synthetic review using refreshed version');
  const reviewRequest = page.waitForRequest(request => request.method() === 'PATCH' && request.url().endsWith(`/staff/reports/${item.id}`));
  await page.getByRole('button', { name: 'Save review', exact: true }).click();
  assert.equal((await reviewRequest).postDataJSON().expectedVersion, reviewed.version);
  await expect(page.getByLabel('Review / priority / closure reason', { exact: true })).toHaveValue('');
  await expect(field).toHaveValue('Draft retained across the report views');
  await views.getByRole('button', { name: 'History', exact: true }).click();
  await expect(field).toBeHidden();
  await views.getByRole('button', { name: 'Summary', exact: true }).click();
  await views.getByRole('button', { name: /^Messages/ }).click();
  await expect(field).toHaveValue('Draft retained across the report views');
  passed('CONV1 First opening shows newest messages; refreshed review fields reflect server state while views preserve the mounted message draft');

  await expect(feed.getByText('Earlier customer update 24:', { exact: false })).toBeVisible();
  await feed.hover(); await page.mouse.wheel(0, -10000);
  await expect.poll(() => feed.evaluate(node => node.scrollTop)).toBeLessThan(80);
  await feed.evaluate(node => { node.setAttribute('data-reference-ui-probe', 'mounted-feed'); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  const position = () => feed.evaluate(node => ({ top: node.scrollTop, height: node.scrollHeight, viewport: node.clientHeight,
    probe: node.getAttribute('data-reference-ui-probe'), messages: node.querySelectorAll('article').length, active: document.activeElement?.tagName }));
  const beforeRefresh = await position();
  await ok(actor, 'POST', `/reports/${item.id}/messages`, { text: 'Incoming update while supplier reads earlier messages' });
  await page.getByRole('button', { name: 'Refresh current record', exact: true }).click();
  await expect(feed.getByText('Incoming update while supplier reads earlier messages', { exact: true })).toBeAttached();
  await writeFile(path.join(output, 'scroll-reading.json'), JSON.stringify({ beforeRefresh, afterRefresh: await position() }, null, 2));
  assert.ok(await feed.evaluate(node => node.scrollTop < 80), 'incoming refresh must preserve the older reading position');
  passed('CONV2 Incoming refresh preserves an earlier reading position');

  await feed.hover(); await page.mouse.wheel(0, 10000);
  await expect.poll(() => feed.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(80);
  await ok(actor, 'POST', `/reports/${item.id}/messages`, { text: 'Incoming update at the bottom of the conversation' });
  await page.getByRole('button', { name: 'Refresh current record', exact: true }).click();
  await expect(feed.getByText('Incoming update at the bottom of the conversation', { exact: true })).toBeVisible();
  await expect.poll(() => feed.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(80);
  passed('CONV3 Near-bottom readers follow new incoming messages');

  await feed.hover(); await page.mouse.wheel(0, -10000);
  await expect.poll(() => feed.evaluate(node => node.scrollTop)).toBeLessThan(80);
  const text = `Synthetic uncertain supplier reply ${item.id}`;
  await field.fill(text);
  const sent: { key: string | undefined; body: string | null }[] = [];
  await page.route(`**/staff/reports/${item.id}/messages`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    sent.push({ key: route.request().headers()['idempotency-key'], body: route.request().postData() });
    if (sent.length === 1) { await route.fetch(); await route.abort('failed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Send to customer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry original action', exact: true })).toBeVisible();
  await expect(field).toBeDisabled();
  await views.getByRole('button', { name: 'Summary', exact: true }).click();
  await views.getByRole('button', { name: /^Messages/ }).click();
  await expect(field).toHaveValue(text);
  await page.getByRole('button', { name: 'Retry original action', exact: true }).click();
  await expect(feed.getByText(text, { exact: true })).toBeVisible();
  await expect(field).toHaveValue('');
  assert.equal(sent.length, 2);
  assert.ok(sent[0].key);
  assert.deepEqual(sent[1], sent[0], 'uncertain retry must reuse the exact operation key and payload');
  const saved = await ok<ReportDetail>(actor, 'GET', `/reports/${item.id}`);
  assert.equal(saved.messages.filter(message => message.text === text).length, 1);
  await expect.poll(() => feed.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(80);
  passed('CONV4 A committed response loss retries the same operation once, clears only on confirmation and reveals own send');

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(field).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(output, `messages-${width}.png`), fullPage: true });
  }
  await page.getByRole('link', { name: 'Back to inbox', exact: true }).click();
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('low_pressure');
  assert.deepEqual(errors, []);
  passed('CONV5 Conversation fits all three widths and returns to the original filtered inbox without runtime errors');
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  throw error;
} finally {
  await writeFile(path.join(output, 'results.txt'), evidence.join('\n') + '\n');
  await context.close();
}
