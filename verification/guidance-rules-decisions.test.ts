import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Advisory, Category, Connection, Guidance, PickupSession, Report, StaffIncident, Zone } from '../aqours-contracts/src/index.ts';
import { actors, connection, key, ok, waterFixture } from './harness.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });

async function issue(category: Category, zone?: Zone) {
  const { a, admin, staff } = users;
  zone ??= await ok<Zone>(admin, 'POST', '/staff/settings/zones', {
    code: `GUIDE-${key()}`, name: 'Fictional isolated guidance zone', demo: true,
  });
  let report = await ok<Report>(a, 'POST', '/reports', {
    connectionId: (await connection(a)).id, category, description: 'Fictional guidance decision observation',
    noticedAt: new Date().toISOString(),
    location: { address: 'Separate fictional issue site', source: 'geocoded_address', confirmed: false },
  });
  report = await ok<Report>(staff, 'PATCH', `/staff/reports/${report.id}`, {
    expectedVersion: report.version, zoneId: zone.id, zoneConfirmed: true,
    reason: 'Supplier explicitly reviewed this fictional issue zone',
  });
  return { report, zone };
}

function assertSafeContext(guide: Guidance) {
  assert.ok(guide.cards.every(card => card.reason && card.source && Number.isFinite(Date.parse(card.updatedAt))));
  assert.doesNotMatch(guide.cards.map(card => card.reason).join('\n'), /water is safe to drink|confirmed contamination|diagnosed household fault|guaranteed water availability/i);
  assert.equal('evidence' in guide, false);
  assert.equal('answers' in guide, false);
}

test('known-outage decision table distinguishes unknown, earlier/later water need, no need and unavailable stock', async () => {
  const { a, staff } = users;
  const fixture = await issue('outage');
  const session = await waterFixture(users.admin, fixture.zone.id, '75.00');
  let incident = await ok<StaffIncident>(staff, 'POST', '/staff/incidents', {
    category: 'outage', summary: 'Fictional guidance outage', zoneIds: [fixture.zone.id],
    area: 'Fictional reviewed issue zone', demo: true,
  });
  const now = Date.now();
  const cases = [
    { name: 'unknown restoration', restorationAt: null, needsWater: true, neededHours: 2, water: true },
    { name: 'water needed before restoration', restorationAt: new Date(now + 4 * 3600000).toISOString(), needsWater: true, neededHours: 2, water: true },
    { name: 'water needed after restoration', restorationAt: new Date(now + 4 * 3600000).toISOString(), needsWater: true, neededHours: 8, water: false },
    { name: 'no stated water need', restorationAt: null, needsWater: false, neededHours: 2, water: false },
    { name: 'unknown restoration without available stock', restorationAt: null, needsWater: true, neededHours: 2, water: false, closeStock: true },
  ];
  for (const scenario of cases) {
    if (scenario.closeStock) await ok<PickupSession>(staff, 'PATCH', `/staff/distribution/sessions/${session.id}`, {
      expectedVersion: session.version, status: 'closed', reason: 'Fictional no-availability decision case',
    });
    await ok(staff, 'POST', `/staff/incidents/${incident.id}/updates`, {
      expectedVersion: incident.version, progress: `Fictional case: ${scenario.name}`,
      area: incident.area, restorationAt: scenario.restorationAt,
    });
    incident = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${incident.id}`);
    const current = await issue('outage', fixture.zone);
    await ok(staff, 'POST', `/staff/reports/${current.report.id}/link`, {
      expectedVersion: current.report.version, incidentId: incident.id, reason: 'Reviewed known incident context',
    });
    const guide = await ok<Guidance>(a, 'POST', `/reports/${current.report.id}/guidance`, { answers: {
      needsWater: scenario.needsWater, waterNeededBy: new Date(now + scenario.neededHours * 3600000).toISOString(),
    } });
    assert.equal(guide.cards.some(card => card.action === 'water_support'), scenario.water, scenario.name);
    const published = guide.cards.find(card => card.action === 'incident');
    assert.equal(published?.sourceId, incident.id);
    assert.match(published?.reason ?? '', scenario.restorationAt ? new RegExp(scenario.restorationAt.replaceAll('.', '\\.')) : /Restoration: unknown/);
    assert.ok(guide.cards.some(card => card.action === 'callback'));
    if (scenario.water) assert.equal(guide.cards.find(card => card.action === 'water_support')?.sourceId, session.id);
    if (scenario.closeStock) assert.ok(guide.uncertainty.some(text => text.includes('No eligible pickup availability')));
    assertSafeContext(guide);
  }
});

test('low pressure, leak hazards and post-resolution persistence lead to assessment without automatic report changes', async () => {
  const { a, staff } = users;
  for (const scenario of [
    { category: 'low_pressure', hazard: false, resolved: false },
    { category: 'leak', hazard: true, resolved: false },
    { category: 'outage', hazard: false, resolved: true },
  ] as const) {
    let { report } = await issue(scenario.category);
    if (scenario.resolved) for (const status of ['under_review', 'in_progress', 'resolved']) report = await ok<Report>(staff, 'PATCH', `/staff/reports/${report.id}`, {
      expectedVersion: report.version, status, reason: 'Reviewed fictional service restoration',
      ...(status === 'resolved' ? { closureOutcome: 'restored' } : {}),
    });
    const guide = await ok<Guidance>(a, 'POST', `/reports/${report.id}/guidance`, { answers: {
      hazard: scenario.hazard, persistent: scenario.resolved, nearbyAffected: 'unknown',
    } });
    assert.ok(guide.cards.some(card => card.action === 'inspection'), scenario.category);
    assert.equal(guide.cards.some(card => card.action === 'escalation'), scenario.hazard);
    assert.ok(!guide.cards.some(card => card.action === 'incident'));
    assert.equal((await ok<Report>(a, 'GET', `/reports/${report.id}`)).status, report.status);
    assertSafeContext(guide);
  }
});

test('conflicting published quality restrictions retain all notices in precedence order alongside escalation', async () => {
  const { a, admin } = users;
  const fixture = await issue('water_quality');
  await ok<Connection>(admin, 'POST', '/staff/settings/connections', {
    customerId: a.user.id, reference: `GUIDE-AUDIENCE-${key()}`, address: 'Fictional notice audience site',
    zoneId: fixture.zone.id, zoneConfirmed: true,
  });
  const notices: Advisory[] = [];
  for (const kind of ['boil_water', 'do_not_drink', 'do_not_use']) {
    const draft = await ok<Advisory>(admin, 'POST', '/staff/advisories', {
      kind, title: `Fictional conflicting ${kind}`, text: `DEMONSTRATION ONLY: approved ${kind} fixture.`,
      source: 'Fictional approved supplier instruction', zoneIds: [fixture.zone.id], demo: true,
      startsAt: new Date(Date.now() + 3600000).toISOString(),
    });
    notices.push(await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, { expectedVersion: draft.version }));
  }
  const guide = await ok<Guidance>(a, 'POST', `/reports/${fixture.report.id}/guidance`, { answers: { hazard: true } });
  const ownNotices = guide.cards.filter(card => notices.some(notice => notice.id === card.sourceId));
  assert.deepEqual(ownNotices.map(card => card.sourceId), [...notices].reverse().map(notice => notice.id));
  assert.ok(ownNotices.every(card => card.action === 'notice' && card.sourceType === 'advisory'));
  for (const notice of notices) assert.equal(ownNotices.find(card => card.sourceId === notice.id)?.reason, notice.text);
  const escalation = guide.cards.findIndex(card => card.action === 'escalation');
  assert.ok(escalation > Math.max(...ownNotices.map(card => guide.cards.indexOf(card))));
  assert.ok(guide.uncertainty.some(text => text.includes('Multiple official restrictions')));
  assertSafeContext(guide);
});
