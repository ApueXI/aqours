import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DB } from '../src/db.js';
import { timeline } from '../src/store.js';

test('public appointment history preserves agreed times without exposing arbitrary audit metadata', async () => {
  const first = '2026-10-19T01:00:00.000Z';
  const later = '2026-10-19T02:00:00.000Z';
  const rows = [
    { id: 'initial', action: 'scheduled', text: 'Agreed visit', metadata: { oldAppointmentAt: null, newAppointmentAt: first, privateContact: 'PRIVATE' } },
    { id: 'moved', action: 'scheduled', text: 'Missed callback; agreed later time', metadata: { oldAppointmentAt: first, newAppointmentAt: later, internalNote: 'PRIVATE' } },
    { id: 'ordinary', action: 'accepted', metadata: { newAppointmentAt: later, privateContact: 'PRIVATE' } },
    { id: 'invalid', action: 'scheduled', metadata: { newAppointmentAt: 'PRIVATE' } },
  ];
  const db = { query: async () => ({ rows }) } as unknown as DB;
  const result = await timeline(db, 'fixture');
  assert.deepEqual(result, [
    { id: 'initial', action: 'scheduled', text: 'Agreed visit', appointmentChange: { from: null, to: first } },
    { id: 'moved', action: 'scheduled', text: 'Missed callback; agreed later time', appointmentChange: { from: first, to: later } },
    { id: 'ordinary', action: 'accepted' },
    { id: 'invalid', action: 'scheduled' },
  ]);
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
