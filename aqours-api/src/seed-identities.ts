import type { DB } from './db.js';
import { create, type Doc } from './store.js';
import { hashPassword } from './auth.js';
export const fixtureId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export async function seedIdentities(db: DB) {
  await create(
    db,
    'supplier',
    { name: 'Aqours Demonstration Water Cooperative', demo: true },
    null,
    null,
    fixtureId(1),
  );
  const users: Doc[] = [];
  for (let n = 0; n < 14; n++) {
    const role = n === 0 ? 'admin' : n === 1 ? 'staff' : 'customer';
    const email =
      n === 0
        ? 'admin@demo.aqours.test'
        : n === 1
          ? 'staff@demo.aqours.test'
          : `customer${String(n - 1).padStart(2, '0')}@demo.aqours.test`;
    const doc = await create(
      db,
      'user',
      {
        email,
        name: n < 2 ? `Demo ${role}` : `Fictional Customer ${n - 1}`,
        phone: n < 2 ? null : `09000000${String(n).padStart(3, '0')}`,
        role,
        active: true,
      },
      null,
      null,
      fixtureId(10 + n),
    );
    await db.query('INSERT INTO credentials(user_id,password_hash) VALUES($1,$2)', [
      doc.id,
      hashPassword('DemoWater2026!'),
    ]);
    users.push(doc);
  }
  const zones: Doc[] = [];
  for (let n = 0; n < 3; n++) {
    const lon = 120.98 + n * 0.025,
      lat = 14.57;
    zones.push(
      await create(
        db,
        'zone',
        {
          code: `DEMO-${n + 1}`,
          name: ['Demo Riverside', 'Demo Hillcrest', 'Demo Lakeside'][n],
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [lon, lat],
                [lon + 0.02, lat],
                [lon + 0.02, lat + 0.03],
                [lon, lat + 0.03],
                [lon, lat],
              ],
            ],
          },
          active: true,
          demo: true,
        },
        null,
        null,
        fixtureId(100 + n),
      ),
    );
  }
  const connections: Doc[] = [];
  for (let n = 0; n < 12; n++) {
    const customer = users[n + 2]!,
      zone = zones[n % 3]!;
    connections.push(
      await create(
        db,
        'connection',
        {
          customerId: customer.id,
          reference: `DEMO-CON-${String(n + 1).padStart(3, '0')}`,
          address: `${n + 1} Fictional Demo Lane, ${zone.name}`,
          zoneId: n === 11 ? null : zone.id,
          zoneConfirmed: n !== 11,
          latitude: n === 11 ? null : 14.58 + n * 0.0005,
          longitude: n === 11 ? null : 120.99 + (n % 3) * 0.025,
        },
        customer.id,
        null,
        fixtureId(200 + n),
      ),
    );
  }
  await create(
    db,
    'rule',
    {
      active: true,
      contactText:
        'Demonstration supplier support: request a callback to arrange assistance. This is not an emergency service.',
      inspectionText: 'Request a supplier inspection for assessment; do not attempt risky repairs.',
      waterText:
        'Pickup requires supplier acceptance and a reserved quantity. No home delivery is promised.',
      createdAt: new Date().toISOString(),
    },
    null,
    null,
    fixtureId(300),
  );
  await create(
    db,
    'approved_guidance',
    {
      kind: 'general',
      text: 'Synthetic demonstration information only. For real water-quality concerns, contact your actual supplier and follow its official notices.',
      source: 'Aqours fictional demonstration fixture; not real public-health advice',
      createdAt: new Date().toISOString(),
    },
    null,
    null,
    fixtureId(301),
  );
  return { users, zones, connections };
}
