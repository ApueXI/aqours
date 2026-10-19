import type { DB } from './db.js';
import { create, event, now, save, type Doc } from './store.js';
import { reportCreate } from './services/reports.js';
import { advisoryFanout, advisoryRevision } from './services/advisories.js';
import { fixtureId } from './seed-identities.js';
import { seedServices } from './seed-services.js';
export async function seedOperations(
  db: DB,
  identities: { users: Doc[]; zones: Doc[]; connections: Doc[] },
) {
  const { users, zones, connections } = identities,
    admin = users[0]!,
    staff = users[1]!;
  const before = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
  const after = (hours: number) => new Date(Date.now() + hours * 3600000).toISOString();
  const incidents: Doc[] = [];
  for (const [n, category] of ['outage', 'low_pressure', 'leak', 'water_quality'].entries()) {
    const doc = await create(
      db,
      'incident',
      {
        category,
        summary: `Demonstration ${category.replace('_', ' ')} investigation`,
        status: 'investigating',
        ownerId: staff.id,
        zoneIds: [zones[n % 3]!.id],
        area: zones[n % 3]!.name,
        geometry: null,
        restorationAt: null,
        estimatedAffected: 25 + n * 10,
        estimateBasis: 'Fictional planning estimate, independent of reports',
        estimateUpdatedAt: now(),
        demo: true,
        createdAt: before(3),
      },
      null,
      null,
      fixtureId(400 + n),
    );
    await create(
      db,
      'incident_update',
      {
        incidentId: doc.id,
        category,
        summary: doc.summary,
        status: doc.status,
        zoneIds: doc.zoneIds,
        progress:
          'Synthetic demonstration update: supplier review underway; restoration estimate unknown.',
        area: doc.area,
        restorationAt: null,
        geometry: null,
        publishedAt: before(1),
        demo: true,
      },
      null,
      doc.id,
      fixtureId(410 + n),
    );
    await event(db, staff.id, doc.id, 'published', 'Demonstration update published');
    incidents.push(doc);
  }
  const reports: Doc[] = [];
  for (let n = 0; n < 12; n++) {
    const customer = users[n + 2]!,
      incident = incidents[n % 4]!;
    let doc = await reportCreate(db, customer, {
      connectionId: connections[n]!.id,
      category: incident.category,
      description: `Fictional demonstration report ${n + 1}: ${incident.category}.`,
      noticedAt: before(4),
      answers: {},
    });
    doc.submittedAt = before(3);
    doc.incidentId = n < 8 ? incident.id : null;
    if (n === 3) {
      doc.firstResolvedAt = before(1);
      doc.firstRespondedAt = before(2);
      doc.status = 'under_review';
    }
    doc = await save(db, 'report', doc);
    await event(
      db,
      customer.id,
      doc.id,
      'submitted',
      'Demonstration report received',
      undefined,
      'received',
    );
    if (n === 3) {
      await event(
        db,
        staff.id,
        doc.id,
        'resolved',
        'Demonstration restored service',
        'in_progress',
        'resolved',
      );
      await event(
        db,
        customer.id,
        doc.id,
        'still_affected',
        'Still affected after demonstration restoration',
        'resolved',
        'under_review',
      );
    }
    reports.push(doc);
  }
  const notice = await create(
    db,
    'advisory',
    {
      kind: 'boil_water',
      title: 'Demonstration quality advisory',
      text: 'SYNTHETIC DEMO ONLY: This notice demonstrates a quality restriction and explicit lifting. It is not real water-safety advice; contact your actual supplier for official guidance.',
      source: 'Fictional academic demonstration fixture',
      zoneIds: [zones[0]!.id],
      connectionIds: [],
      geometry: null,
      startsAt: before(1),
      endsAt: before(0.5),
      state: 'published',
      publishedAt: before(1),
      liftedAt: null,
      liftReason: null,
      demo: true,
      updatedAt: now(),
    },
    null,
    null,
    fixtureId(500),
  );
  await advisoryRevision(db, notice, 'published');
  await advisoryFanout(db, notice, 'published');
  await event(db, admin.id, notice.id, 'published', 'Synthetic demo notice published');
  await seedServices(db, { zones, connections, reports, staff, before, after });
}
