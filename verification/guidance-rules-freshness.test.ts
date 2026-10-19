import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Advisory, AssistanceRequest, Connection, Guidance, PickupSession, Report, StaffIncident, Zone } from '../aqours-contracts/src/index.ts';
import { actors, key, ok, transition, waterFixture } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const sql = (query: string) => databaseSQL(query, database);
function uuid(value: string) { assert.match(value, /^[0-9a-f-]{36}$/i); return value; }

async function fixture() {
  const { a, admin } = users;
  const zone = await ok<Zone>(admin, 'POST', '/staff/settings/zones', {
    code: `FRESH-${key()}`, name: 'Fictional guidance freshness zone', demo: true,
  });
  const conn = await ok<Connection>(admin, 'POST', '/staff/settings/connections', {
    customerId: a.user.id, reference: `FRESH-${key()}`, address: 'Fictional freshness service site',
    zoneId: zone.id, zoneConfirmed: true,
  });
  const report = await ok<Report>(a, 'POST', '/reports', {
    connectionId: conn.id, category: 'outage', description: 'Fictional freshness observation', noticedAt: new Date().toISOString(),
  });
  const session = await waterFixture(admin, zone.id, '50.00');
  return { zone, report, session };
}

async function evaluate(reportId: string) {
  return ok<Guidance>(users.a, 'POST', `/reports/${reportId}/guidance`, { answers: { needsWater: true } });
}

async function historical(original: Guidance) {
  const saved = await ok<Guidance>(users.a, 'GET', `/guidance/${original.id}`);
  assert.equal(saved.current, false);
  assert.equal(saved.evaluatedAt, original.evaluatedAt);
  assert.equal(saved.sourceSignature, original.sourceSignature);
  assert.deepEqual(saved.cards, original.cards);
  assert.equal('evidence' in saved, false);
}

test('incident publication, advisory revision/lift and stock changes invalidate immutable guidance; stale choices never submit assistance', async () => {
  const { a, admin, staff } = users;
  const context = await fixture();
  let incident = await ok<StaffIncident>(staff, 'POST', '/staff/incidents', {
    category: 'outage', summary: 'Fictional freshness incident', zoneIds: [context.zone.id],
    area: 'Fictional freshness zone', demo: true,
  });
  await ok(staff, 'POST', `/staff/reports/${context.report.id}/link`, {
    expectedVersion: context.report.version, incidentId: incident.id, reason: 'Staff confirmed freshness fixture association',
  });
  await ok(staff, 'POST', `/staff/incidents/${incident.id}/updates`, {
    expectedVersion: incident.version, progress: 'Fictional first published progress', area: incident.area, restorationAt: null,
  });
  let guide = await evaluate(context.report.id);
  assert.ok(guide.cards.some(card => card.action === 'water_support' && card.sourceId === context.session.id));
  incident = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${incident.id}`);
  await ok(staff, 'POST', `/staff/incidents/${incident.id}/updates`, {
    expectedVersion: incident.version, progress: 'Fictional revised customer progress', area: incident.area, restorationAt: null,
  });
  await historical(guide);
  const firstHistorical = guide;
  guide = await evaluate(context.report.id);
  assert.ok(guide.cards.some(card => card.sourceId === incident.id && card.reason.includes('revised customer progress')));

  let advisory = await ok<Advisory>(admin, 'POST', '/staff/advisories', {
    kind: 'do_not_drink', title: 'Fictional freshness quality notice',
    text: 'DEMONSTRATION ONLY: original approved notice fixture.', source: 'Fictional approved supplier source',
    zoneIds: [context.zone.id], demo: true,
  });
  advisory = await ok<Advisory>(admin, 'POST', `/staff/advisories/${advisory.id}/publish`, { expectedVersion: advisory.version });
  await historical(guide);
  guide = await evaluate(context.report.id);
  assert.equal(guide.cards.find(card => card.sourceId === advisory.id)?.reason, advisory.text);
  const beforeRevision = guide;
  advisory = await ok<Advisory>(admin, 'PATCH', `/staff/advisories/${advisory.id}`, {
    expectedVersion: advisory.version, reason: 'Authorized fictional text correction',
    text: 'DEMONSTRATION ONLY: revised approved notice fixture.',
  });
  await historical(beforeRevision);
  guide = await evaluate(context.report.id);
  const revisedCard = guide.cards.find(card => card.sourceId === advisory.id);
  assert.equal(revisedCard?.reason, advisory.text);
  assert.equal(revisedCard?.sourceVersion, advisory.version);
  await ok(admin, 'POST', `/staff/advisories/${advisory.id}/lift`, {
    expectedVersion: advisory.version, reason: 'Explicit authorized fictional lift',
  });
  await historical(guide);
  guide = await evaluate(context.report.id);
  assert.ok(!guide.cards.some(card => card.sourceId === advisory.id));

  await ok<PickupSession>(staff, 'PATCH', `/staff/distribution/sessions/${context.session.id}`, {
    expectedVersion: context.session.version, totalLiters: '0.00', reason: 'Fictional available stock exhausted before request',
  });
  await historical(guide);
  const noStock = await evaluate(context.report.id);
  assert.ok(!noStock.cards.some(card => card.action === 'water_support'));
  assert.ok(noStock.uncertainty.some(text => text.includes('No eligible pickup availability')));
  assert.ok(noStock.cards.some(card => card.action === 'callback'));

  const count = () => sql(`SELECT count(*) FROM records WHERE kind='assistance' AND parent_id='${uuid(context.report.id)}'`);
  assert.equal(count(), '0');
  const operation = key();
  const choice = await ok<{ id: string; action: string }>(a, 'POST', `/guidance/${firstHistorical.id}/choice`, { action: 'water_support' }, operation);
  assert.equal((await ok<{ id: string }>(a, 'POST', `/guidance/${firstHistorical.id}/choice`, { action: 'water_support' }, operation)).id, choice.id);
  assert.equal(choice.action, 'water_support');
  assert.equal(count(), '0');
  assert.equal(sql(`SELECT count(*) FROM allocations WHERE request_id IN (SELECT id FROM records WHERE kind='assistance' AND parent_id='${context.report.id}')`), '0');
  assert.equal((await ok<Report>(a, 'GET', `/reports/${context.report.id}`)).status, 'received');
});

test('reservation and release change stock evidence without changing earlier guidance or claiming fulfillment', async () => {
  const { a, staff } = users;
  const context = await fixture();
  const original = await evaluate(context.report.id);
  const requested = await ok<AssistanceRequest>(a, 'POST', '/assistance-requests', {
    reportId: context.report.id, type: 'water_support',
    details: { requestedLiters: '40.00', sessionId: context.session.id },
  });
  assert.equal(requested.allocation, null);
  const accepted = await transition(staff, requested, 'accepted', { ownerId: staff.user.id });
  assert.equal(accepted.session?.remainingLiters, '10.00');
  await historical(original);
  const reserved = await evaluate(context.report.id);
  assert.ok(reserved.cards.some(card => card.action === 'water_support' && card.reason.includes('10.00 liters')));
  const cancelled = await ok<AssistanceRequest>(a, 'POST', `/assistance-requests/${accepted.id}/cancel`, {
    expectedVersion: accepted.version, reason: 'Fictional reservation no longer needed',
  });
  assert.equal(cancelled.allocation?.state, 'released');
  assert.equal(cancelled.session?.remainingLiters, '50.00');
  await historical(reserved);
  const released = await evaluate(context.report.id);
  assert.ok(released.cards.some(card => card.action === 'water_support' && card.reason.includes('50.00 liters')));
  assert.notEqual(released.sourceSignature, reserved.sourceSignature);
});
