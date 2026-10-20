import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Advisory, AssistanceRequest, IncidentUpdate, PublishedIncident, Report, ReportDetail, StaffIncident } from '../aqours-contracts/src/index.ts';
import { actors, base, connection, key, ok, origin, report, request, transition } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const fields = (value: object, names: string) => assert.deepEqual(Object.keys(value).sort(), names.split(' ').sort());
const reportFields = 'id reference customerId connectionId category description guidedDetails noticedAt submittedAt status address structuredAddress locationSource latitude longitude accuracy locationConfirmed zoneId zoneConfirmed locationReview priority priorityReason ownerId incidentId closureOutcome closureReason version firstRespondedAt firstResolvedAt';
const advisoryFields = 'id kind title text source zoneIds connectionIds geometry startsAt endsAt state publishedAt liftedAt liftReason version demo updatedAt';
function incidentProjection(value: PublishedIncident) {
  fields(value, 'id category summary status zoneIds demo latestUpdate updates');
  for (const update of [value.latestUpdate, ...value.updates])
    fields(update, 'id incidentId status progress area restorationAt publishedAt demo geometry');
}
function privateField(id: string, sentinel: string) {
  assert.match(id, /^[0-9a-f-]{36}$/i);
  assert.match(sentinel, /^[a-z0-9-]+$/i);
  // Add a future private column only in this disposable verification database.
  const kind = databaseSQL(`SELECT kind FROM entities WHERE id='${id}'`, database);
  const table = ({report:'reports', incident:'incidents', advisory:'advisories', assistance:'assistance_requests'} as Record<string,string>)[kind];
  assert.ok(table);
  databaseSQL(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS future_private_field text;
    UPDATE ${table} SET future_private_field='${sentinel}' WHERE id='${id}'`, database);
}
async function sharedIncident() {
  return ok<StaffIncident>(users.staff, 'POST', '/staff/incidents', {
    category: 'outage', summary: `Fictional public incident ${key()}`, zoneIds: [(await connection(users.a)).zoneId],
    area: 'Fictional public service area', ownerId: users.staff.user.id, demo: true,
    estimatedAffected: 73, estimateBasis: `PRIVATE-ESTIMATE-${key()}`,
  });
}
async function notice() {
  return ok<Advisory>(users.admin, 'POST', '/staff/advisories', {
    kind: 'do_not_use', title: `Fictional quality acceptance ${key()}`, text: `PRIVATE-DRAFT-${key()}`,
    source: 'Fictional supplier test source', zoneIds: [],
    connectionIds: [(await connection(users.a)).id, (await connection(users.b)).id], demo: true,
    startsAt: '2000-01-01T00:00:00.000Z', endsAt: '2000-01-02T00:00:00.000Z',
  });
}

test('public incident, advisory and owned-report projections exclude private sentinels and retain exact publication revision/lift audit', async () => {
  const { a, b, staff, admin } = users;
  const own = await report(a, 'outage', `Fictional owned privacy fixture ${key()}`);
  const foreign = await ok<Report>(b, 'POST', '/reports', {
    connectionId: (await connection(b)).id, category: 'outage', description: `PRIVATE-HOUSEHOLD-${key()}`,
    noticedAt: new Date().toISOString(), answers: { details: `PRIVATE-ANSWER-${key()}` },
    location: { source: 'gps', address: `PRIVATE-ADDRESS-${key()}`, latitude: 14.123456789, longitude: 121.987654321, confirmed: true },
  });
  const shared = await sharedIncident(), note = `PRIVATE-NOTE-${key()}`, future = `PRIVATE-FUTURE-${key()}`;
  assert.equal((await request(a, 'GET', `/incidents/${shared.id}`)).status, 404);
  for (const item of [own, foreign]) await ok(staff, 'POST', `/staff/reports/${item.id}/link`, {
    expectedVersion: item.version, incidentId: shared.id, reason: 'Reviewed fictional association',
  });
  for (const [kind, id] of [['reports', own.id], ['incidents', shared.id]])
    await ok(staff, 'POST', `/staff/${kind}/${id}/notes`, { text: note });
  await ok(staff, 'POST', `/staff/reports/${own.id}/messages`, { text: 'Fictional public acknowledgment' });
  const update = await ok<IncidentUpdate>(staff, 'POST', `/staff/incidents/${shared.id}/updates`, {
    expectedVersion: shared.version, progress: 'Fictional published progress', area: shared.area, restorationAt: null,
  });
  const current = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${shared.id}`);
  const unpublished = `PRIVATE-UNPUBLISHED-${key()}`;
  await ok(staff, 'PATCH', `/staff/incidents/${shared.id}`, { expectedVersion: current.version, reason: 'Private next draft', summary: unpublished });
  let advisory = await notice();
  const draftText = advisory.text;
  assert.equal((await request(a, 'GET', `/advisories/${advisory.id}`)).status, 404);
  assert.ok(!(await ok<Advisory[]>(a, 'GET', '/advisories?includeLifted=true&limit=100')).some(value => value.id === advisory.id));
  advisory = await ok<Advisory>(admin, 'PATCH', `/staff/advisories/${advisory.id}`, {
    expectedVersion: advisory.version, reason: 'Approved fictional text replaces draft', text: 'DEMONSTRATION ONLY: fictional approved restriction',
  });
  const published = await ok<Advisory>(admin, 'POST', `/staff/advisories/${advisory.id}/publish`, { expectedVersion: advisory.version });
  for (const id of [own.id, shared.id, published.id]) privateField(id, future);
  const staffDetail = await ok<ReportDetail>(staff, 'GET', `/staff/reports/${foreign.id}`);
  assert.equal(staffDetail.customer?.email, b.user.email);
  assert.equal(staffDetail.latitude, foreign.latitude);
  assert.ok((await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${shared.id}`)).notes?.some(value => value.text === note));
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lqkAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), 'fictional-privacy.png');
  const upload = await fetch(base + `/reports/${own.id}/attachments`, {
    method: 'POST', headers: { Origin: origin, Authorization: `Bearer ${a.token}`, 'Idempotency-Key': key() }, body: form,
  });
  assert.equal(upload.status, 200);
  const detail = await ok<ReportDetail>(a, 'GET', `/reports/${own.id}`);
  fields(detail, reportFields + ' messages attachments timeline incident');
  assert.equal(detail.attachments.length, 1);
  for (const attachment of detail.attachments) fields(attachment, 'id filename mediaType byteSize createdAt');
  assert.equal(detail.messages.length, 1);
  for (const message of detail.messages) fields(message, 'id text authorId authorRole createdAt');
  for (const event of detail.timeline) fields(event, 'id action text actorId fromStatus toStatus createdAt');
  const safe = await ok<PublishedIncident>(a, 'GET', `/incidents/${shared.id}`);
  incidentProjection(safe);
  incidentProjection(detail.incident!);
  assert.equal(safe.latestUpdate.id, update.id);
  assert.equal(safe.summary, shared.summary);
  const incidentList = await ok<PublishedIncident[]>(a, 'GET', '/incidents?limit=100');
  const advisoryList = await ok<Advisory[]>(a, 'GET', '/advisories?limit=100');
  const reportList = await ok<Report[]>(a, 'GET', '/reports?limit=100');
  assert.ok(incidentList.some(value => value.id === shared.id));
  assert.ok(advisoryList.some(value => value.id === published.id));
  assert.ok(reportList.some(value => value.id === own.id));
  for (const value of incidentList) incidentProjection(value);
  for (const value of reportList) fields(value, reportFields);
  const ownConnectionIds=new Set((await ok<{id:string}[]>(a,'GET','/me/connections')).map(value=>value.id));
  for (const value of advisoryList) { fields(value, advisoryFields); assert.ok(value.connectionIds.every(id=>ownConnectionIds.has(id))); }
  const publicNotice = await ok<Advisory>(a, 'GET', `/advisories/${published.id}`);
  fields(publicNotice, advisoryFields + ' revisions');
  assert.deepEqual(publicNotice.connectionIds,[(await connection(a)).id]);
  for (const revision of publicNotice.revisions!) fields(revision, 'version text source action createdAt');
  const publicPayloads = JSON.stringify([detail, safe, publicNotice, incidentList, advisoryList, reportList]);
  for (const sentinel of [note, future, unpublished, draftText, shared.estimateBasis!, foreign.id, foreign.description,
    foreign.guidedDetails!, foreign.address, foreign.connectionId, String(foreign.latitude), String(foreign.longitude), b.user.email])
    assert.ok(!publicPayloads.includes(sentinel), 'Private sentinel escaped into a customer payload');
  const revisionReason = 'Fictional approved correction', liftReason = 'Fictional authority explicitly lifted this restriction';
  const revised = await ok<Advisory>(admin, 'PATCH', `/staff/advisories/${published.id}`, {
    expectedVersion: published.version, reason: revisionReason, text: 'DEMONSTRATION ONLY: corrected approved restriction',
  });
  const liftKey = key(), liftBody = { expectedVersion: revised.version, reason: liftReason };
  for (const actor of [a, staff])
    assert.equal((await request(actor, 'POST', `/staff/advisories/${published.id}/lift`, liftBody, key())).status, 403);
  assert.equal((await ok<Advisory>(a, 'GET', `/advisories/${published.id}`)).state, 'published');
  const beforeLift = Date.now();
  const lifted = await ok<Advisory>(admin, 'POST', `/staff/advisories/${published.id}/lift`, liftBody, liftKey);
  const afterLift = Date.now();
  assert.equal((await ok<Advisory>(admin, 'POST', `/staff/advisories/${published.id}/lift`, liftBody, liftKey)).version, lifted.version);
  assert.equal(lifted.liftReason, liftReason);
  assert.ok(Date.parse(lifted.liftedAt!) >= beforeLift && Date.parse(lifted.liftedAt!) <= afterLift);
  const audit = await ok<{ targetId: string; actorId: string; action: string; text: string; createdAt: string }[]>(staff, 'GET', '/staff/audit?limit=100');
  for (const [action, text] of [['revised', revisionReason], ['lifted', liftReason]]) {
    const matching = audit.filter(value => value.targetId === published.id && value.action === action && value.text === text);
    assert.equal(matching.length, 1);
    assert.equal(matching[0].actorId, admin.user.id);
    if (action === 'lifted') assert.ok(Date.parse(matching[0].createdAt) >= beforeLift && Date.parse(matching[0].createdAt) <= afterLift);
  }
  const history = await ok<Advisory>(a, 'GET', `/advisories/${published.id}`);
  assert.deepEqual(history.revisions!.map(value => [value.action, value.version, value.text]), [
    ['lifted', lifted.version, revised.text], ['revised', revised.version, revised.text], ['published', published.version, published.text],
  ]);
  assert.ok(!(await ok<Advisory[]>(a, 'GET', '/advisories?limit=100')).some(value => value.id === published.id));
  const snapshots = JSON.parse(databaseSQL(`SELECT json_agg(data->'snapshot' ORDER BY version) FROM records WHERE kind='advisory_revision' AND parent_id='${published.id}' AND data->>'action'<>'draft'`, database));
  assert.deepEqual(snapshots, [published, revised, lifted]);
});

test('individual still-affected preserves a resolved incident, another resolved report, expired-date quality restriction and completed assistance', async () => {
  const { a, b, staff, admin } = users;
  let first = await report(a), other = await report(b), shared = await sharedIncident();
  let service = await ok<AssistanceRequest>(a, 'POST', '/assistance-requests', {
    reportId: first.id, type: 'callback', details: { question: 'Fictional independence check', contactMethod: 'phone', contactNumber: '09000000001', preferredWindow: 'Now' },
  });
  for (const item of [first, other]) {
    let linked = await ok<Report>(staff, 'POST', `/staff/reports/${item.id}/link`, { expectedVersion: item.version, incidentId: shared.id, reason: 'Fictional reviewed link' });
    for (const status of ['under_review', 'in_progress', 'resolved']) linked = await ok<Report>(staff, 'PATCH', `/staff/reports/${item.id}`, {
      expectedVersion: linked.version, status, reason: 'Fictional independent report resolution', ...(status === 'resolved' ? { closureOutcome: 'restored' } : {}),
    });
    if (item.id === first.id) first = linked; else other = linked;
  }
  const draft = await notice();
  const quality = await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, { expectedVersion: draft.version });
  for (const status of ['confirmed', 'work_in_progress', 'monitoring', 'resolved']) shared = await ok<StaffIncident>(staff, 'PATCH', `/staff/incidents/${shared.id}`, {
    expectedVersion: shared.version, status, reason: 'Fictional reviewed shared restoration',
  });
  await ok(staff, 'POST', `/staff/incidents/${shared.id}/updates`, { expectedVersion: shared.version, progress: 'Fictional resolved publication', area: shared.area, restorationAt: null });
  service = await transition(staff, service, 'accepted', { ownerId: staff.user.id });
  service = await transition(staff, service, 'in_progress', { reason: 'Fictional immediate callback' });
  service = await transition(staff, service, 'completed', { outcome: 'Fictional callback completed', nextSteps: 'Review report independently' });
  const note = `PRIVATE-ASSISTANCE-${key()}`;
  await ok(staff, 'POST', `/staff/assistance-requests/${service.id}/notes`, { text: note });
  privateField(service.id, `PRIVATE-ASSISTANCE-FUTURE-${key()}`);
  const paths = [`/incidents/${shared.id}`, `/reports/${other.id}`, `/advisories/${quality.id}`, `/assistance-requests/${service.id}`];
  const audience = [a, b, a, a];
  const independentRecords = () => databaseSQL(`SELECT json_agg(r ORDER BY id) FROM records r WHERE id IN
    ('${shared.id}','${other.id}','${quality.id}','${service.id}')`, database);
  const storedBefore = independentRecords();
  const before = await Promise.all(paths.map((path, index) => ok(audience[index], 'GET', path)));
  const reopened = await ok<Report>(a, 'POST', `/reports/${first.id}/still-affected`, { expectedVersion: first.version, reason: 'Fictional household still affected' });
  assert.equal(reopened.status, 'under_review');
  assert.equal(reopened.firstResolvedAt, first.firstResolvedAt);
  assert.deepEqual(await Promise.all(paths.map((path, index) => ok(audience[index], 'GET', path))), before);
  assert.equal(independentRecords(), storedBefore);
  assert.equal((before[0] as StaffIncident).status, 'resolved');
  assert.equal((before[1] as Report).status, 'resolved');
  assert.equal((before[2] as Advisory).state, 'published');
  assert.ok((await ok<Advisory[]>(a, 'GET', '/advisories?limit=100')).some(value => value.id === quality.id));
  const completed = before[3] as AssistanceRequest;
  assert.equal(completed.status, 'completed');
  fields(completed, 'id reference customerId reportId incidentId type status ownerId details appointmentAt outcome nextSteps reason createdAt updatedAt version allocation session canCancel timeline');
  assert.ok(!('startedAt' in completed) && !JSON.stringify(completed).includes(note));
  assert.equal((await ok<PublishedIncident>(a, 'GET', `/incidents/${shared.id}`)).status, 'resolved');
});
