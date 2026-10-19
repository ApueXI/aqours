import type { DB } from './db.js';
import { create, now, event, notify, type Doc } from './store.js';
import { fixtureId } from './seed-identities.js';
import { reserve } from './services/stock.js';
export async function seedServices(
  db: DB,
  context: {
    zones: Doc[];
    connections: Doc[];
    reports: Doc[];
    staff: Doc;
    before: (hours: number) => string;
    after: (hours: number) => string;
  },
) {
  const { zones, connections, reports, staff, before, after } = context;
  const sites: Doc[] = [];
  for (let n = 0; n < 2; n++)
    sites.push(
      await create(
        db,
        'site',
        {
          name: ['Demo Riverside Pickup', 'Demo Hillcrest Pickup'][n],
          address: `${n + 1} Fictional Distribution Road`,
          instructions: 'Demonstration: bring the issued pickup reference and suitable containers.',
          latitude: 14.59 + n * 0.01,
          longitude: 121.0 + n * 0.01,
          active: true,
          demo: true,
        },
        null,
        null,
        fixtureId(600 + n),
      ),
    );
  const sessions: Doc[] = [];
  for (let n = 0; n < 3; n++) {
    const doc = await create(
      db,
      'pickup_session',
      {
        siteId: sites[n % 2]!.id,
        zoneIds: zones.map((v) => v.id),
        startsAt: after(1),
        endsAt: after(48),
        status: n === 2 ? 'cancelled' : 'open',
        instructions: [
          'Demonstration available session',
          'Demonstration fully reserved session',
          'Demonstration cancelled session',
        ][n],
        demo: true,
        updatedAt: now(),
      },
      null,
      sites[n % 2]!.id,
      fixtureId(700 + n),
    );
    await db.query('INSERT INTO stock_sessions(id,total) VALUES($1,$2)', [
      doc.id,
      n === 0 ? '1000.00' : '100.00',
    ]);
    sessions.push(doc);
  }
  const fixtures = [
    {
      index: 0,
      type: 'water_support',
      status: 'accepted',
      details: {
        requestedLiters: '20.00',
        sessionId: sessions[0]!.id,
        notes: 'Demonstration pickup',
      },
    },
    {
      index: 1,
      type: 'water_support',
      status: 'accepted',
      details: {
        requestedLiters: '100.00',
        sessionId: sessions[1]!.id,
        notes: 'Full stock fixture',
      },
    },
    {
      index: 2,
      type: 'callback',
      status: 'requested',
      details: {
        question: 'Please explain this demonstration report',
        contactMethod: 'phone',
        contactNumber: '09000000003',
        preferredWindow: 'Tomorrow morning',
      },
    },
    {
      index: 3,
      type: 'inspection',
      status: 'scheduled',
      details: {
        issueDetails: 'Demonstration persistent low pressure',
        siteAddress: connections[3]!.address,
        preferredWindow: 'Tomorrow afternoon',
        accessInstructions: 'Fictional front gate',
      },
    },
    {
      index: 11,
      type: 'water_support',
      status: 'requested',
      details: {
        requestedLiters: '10.00',
        sessionId: null,
        notes: 'Unmatched zone; supplier follow-up needed',
      },
    },
  ];
  for (const [n, fixture] of fixtures.entries()) {
    const report = reports[fixture.index]!;
    const request = await create(
      db,
      'assistance',
      {
        reportId: report.id,
        incidentId: report.incidentId,
        customerId: report.customerId,
        reference: `DEMO-HELP-${n + 1}`,
        type: fixture.type,
        status: fixture.status,
        ownerId: fixture.status === 'requested' ? null : staff.id,
        details: fixture.details,
        appointmentAt: fixture.status === 'scheduled' ? after(24) : null,
        outcome: null,
        nextSteps: null,
        reason: null,
        startedAt: null,
        createdAt: before(1),
        updatedAt: now(),
      },
      report.customerId,
      report.id,
      fixtureId(800 + n),
    );
    if (fixture.type === 'water_support' && fixture.status === 'accepted')
      await reserve(db, request, sessions[n]!);
    const key = await event(
      db,
      staff.id,
      request.id,
      fixture.status,
      'Demonstration assistance scenario',
      'requested',
      fixture.status,
    );
    await notify(
      db,
      report.customerId,
      key,
      'assistance',
      request.id,
      'Demonstration assistance update',
      `Your fictional request is ${fixture.status}`,
    );
  }
}
