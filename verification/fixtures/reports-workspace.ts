export const staff = { id: 'staff', name: 'Mariel Santos', role: 'admin', active: true };
export const reports = ['outage', 'low_pressure', 'leak', 'water_quality', 'outage', 'leak'].map((category, i) => ({
  id: `report-${i}`, reference: `RPT-2026-00${i + 1}`, customerId: `customer-${i}`, connectionId: `connection-${i}`,
  category, status: ['received', 'under_review', 'in_progress', 'received', 'resolved', 'under_review'][i], priority: i === 3 ? 'urgent' : 'normal',
  description: ['No water since early this morning.', 'Water pressure drops in the afternoon.', 'Water leaking near the meter.', 'Water appears cloudy after service resumed.', 'Supply has returned to normal.', 'A leak near the main road.'][i],
  address: ['Brgy. Real, Calamba City', 'Brgy. Halang, Calamba City', 'Brgy. Bucal, Calamba City', 'Brgy. Pansol, Calamba City', 'Brgy. Canlubang, Calamba City', 'Brgy. Parian, Calamba City'][i],
  latitude: 14.21 + i * .008, longitude: 121.15 + i * .007, zoneId: null, zoneConfirmed: true, locationReview: i === 2, locationSource: 'gps', accuracy: null,
  submittedAt: `2026-10-23T0${i}:00:00Z`, noticedAt: `2026-10-23T0${i}:00:00Z`, updatedAt: `2026-10-23T0${i}:30:00Z`,
  ownerId: i % 2 ? 'staff' : null, version: 1, attachments: [], messages: [], timeline: [], notes: [],
}));
export const metrics = { from: '2026-10-01T00:00:00Z', to: '2026-10-24T00:00:00Z', asOf: '2026-10-23T08:00:00Z', timezone: 'Asia/Manila', cohort: 'Reports submitted in the selected period.', activeIncidents: 1, unresolvedReports: 5, reportCount: 6, uniqueConnections: 6, categories: { outage: 2, low_pressure: 1, leak: 2, water_quality: 1 }, reviewedClosures: 0, reopenedReports: 0, firstResponse: { meanSeconds: 1800, sampleCount: 4, pendingCount: 2 }, firstResolution: { meanSeconds: 7200, sampleCount: 1, pendingCount: 5, excludedCount: 0 } };
export function reportsWorkspaceFixture(path: string, params: URLSearchParams) {
  if (path === '/auth/session') return { user: staff };
  if (path === '/staff/metrics') return metrics;
  if (path === '/staff/users') return [staff];
  if (path === '/staff/zones') return [{ id: 'real', code: 'REAL', name: 'Real', active: true }];
  if (path === '/staff/reports') return reports.filter(r => (!params.get('category') || r.category === params.get('category')) && (!params.get('status') || r.status === params.get('status')));
  if (path.startsWith('/staff/reports/')) return reports.find(r => r.id === path.split('/').at(-1));
  if (path === '/staff/messages') return reports.map((r, i) => ({ ...r, reportId: r.id, latestMessage: i === 4 ? null : { authorRole: i % 2 ? 'staff' : 'customer', text: ['Is there an update on water restoration?', 'We are checking the pressure in your area.', 'The leak is still visible near our meter.', 'Please avoid drinking the water until the notice is lifted.', '', 'Thank you for reporting. A team is reviewing the location.'][i] } }));
  if (path === '/staff/connections') return reports.map(r => ({ id: r.connectionId, customerId: r.customerId, reference: r.connectionId, address: r.address, latitude: r.latitude, longitude: r.longitude }));
  if (path === '/staff/map/reports') return { type: 'FeatureCollection', features: reports.map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] }, properties: r })), total: 6, unlocatedCount: 0, limit: 1000, truncated: false };
  return [];
}
