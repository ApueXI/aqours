import type { Advisory, AssistanceRequest, MonitoringOverview, PickupSession, WeatherForecast, WeatherPsgcLocation } from '../../aqours-contracts/src/index.ts';
import { reports, reportsWorkspaceFixture, staff } from './reports-workspace.ts';

const stamp = '2026-10-24T02:00:00Z';
export const days = Array.from({ length: 7 }, (_, i) => `2026-10-${24 + i}`);
export const forecast: WeatherForecast = {
  location: { latitude: 14.21, longitude: 121.16 }, timezone: 'Asia/Manila', fetchedAt: stamp,
  current: { time: stamp, weatherCode: 2, temperature: 31.2, feelsLike: 35.1, humidity: 72, precipitation: 0, windSpeed: 8.4 },
  daily: days.map((date, i) => ({ date, weatherCode: [2, 61, 3, 61, 2, 0, 2][i], temperatureMin: 24 + i / 10, temperatureMax: 32 + i / 10, precipitation: [0, 4.2, 0, 6.5, 0, 0, 1.2][i], rainProbability: [15, 70, 30, 85, 20, 10, 25][i] })),
  units: { temperature: '°C', precipitation: 'mm', windSpeed: 'km/h', probability: '%' },
  attribution: { name: 'Open-Meteo', url: 'https://open-meteo.com/' },
};
export const locations: WeatherPsgcLocation[] = ['Calamba', 'Los Baños', 'Unavailable locality'].map((name, i) => ({
  code: ['0403405000', '0403411000', '0403400001'][i], name, level: 'city', latitude: i === 2 ? null : 14.21 + i * .03, longitude: i === 2 ? null : 121.16 + i * .03,
  ancestry: [{ code: '0400000000', name: 'CALABARZON', level: 'region' }, { code: '0403400000', name: 'Laguna', level: 'province' }, { code: ['0403405000', '0403411000', '0403400001'][i], name, level: 'city' }],
}));
export const incidents = reports.map((report, i) => ({
  id: `incident-${i}`, summary: ['Supply interruption in Real', 'Low pressure in Halang', 'Mainline leak in Bucal', 'Water quality review in Pansol', 'Restored supply in Canlubang', 'Leak investigation in Parian'][i],
  category: report.category, status: ['investigating', 'confirmed', 'work_in_progress', 'monitoring', 'resolved', 'investigating'][i],
  ownerId: i % 2 ? staff.id : null, reportCount: i + 1, uniqueConnections: i + 1, estimatedAffected: i === 0 ? null : (i + 1) * 10,
  restorationAt: i === 0 ? null : stamp, demo: true, version: 1, zoneIds: [], timeline: [], notes: [], reports: [], updates: [], published: null,
}));
export const advisories: Advisory[] = ['Scheduled supply interruption', 'Boil water notice', 'Water quality restriction', 'Do not use notice', 'Service recovery update'].map((title, i) => ({
  id: `advisory-${i}`, title, kind: ['scheduled_interruption', 'boil_water', 'do_not_drink', 'do_not_use', 'general'][i] as Advisory['kind'],
  state: ['draft', 'published', 'published', 'lifted', 'draft'][i] as Advisory['state'], text: 'Fictional supplier notice for interface verification.',
  source: 'Fictional supplier', zoneIds: ['real'], connectionIds: [], geometry: null, startsAt: null, endsAt: null, publishedAt: stamp,
  liftedAt: null, liftReason: null, version: 1, demo: true, updatedAt: stamp, revisions: [],
}));
export const assistance: AssistanceRequest[] = reports.map((report, i) => ({
  id: `request-${i}`, reference: `AST-2026-00${i + 1}`, reportId: report.id, customerId: report.customerId, incidentId: null,
  type: ['callback', 'inspection', 'water_support'][i % 3] as AssistanceRequest['type'],
  status: ['requested', 'accepted', 'scheduled', 'in_progress', 'completed', 'unavailable'][i] as AssistanceRequest['status'],
  ownerId: i % 2 ? staff.id : null, details: { requestedLiters: '20.00' }, appointmentAt: i % 2 ? stamp : null,
  outcome: null, nextSteps: null, reason: null, createdAt: stamp, updatedAt: stamp, version: 1, timeline: [], notes: [], allocation: null, session: null, canCancel: false,
}));
export const sites = ['Real barangay hall', 'Halang pickup point', 'Bucal collection site'].map((name, i) => ({
  id: `site-${i}`, name, address: ['Brgy. Real, Calamba City', 'Brgy. Halang, Calamba City', 'Brgy. Bucal, Calamba City'][i],
  instructions: 'Fictional pickup location. Bring your reservation reference.', active: true, demo: true,
  latitude: i === 2 ? null : 14.21 + i * .02, longitude: i === 2 ? null : 121.16 + i * .02, version: 1,
}));
export const sessions: PickupSession[] = sites.map((site, i) => ({
  id: `session-${i}`, siteId: site.id, site, zoneIds: ['real'], startsAt: stamp, endsAt: '2026-10-24T10:00:00Z', status: 'open', instructions: site.instructions,
  totalLiters: '1000.00', reservedLiters: '200.00', collectedLiters: '100.00', remainingLiters: '700.00', availability: 'available', version: 1, demo: true, updatedAt: stamp,
}));
export const monitoring: MonitoringOverview = {
  supplier: { id: 'supplier', name: 'Aqours demonstration supplier' }, asOf: stamp, dates: days, temperatureBands: { version: 1, boundaries: [25, 30, 35, 40] },
  sites: sites.map((site, i) => ({ site, config: null, warnings: [],
    weather: { status: i === 2 ? 'unlocated' : 'fresh', forecast: i === 2 ? null : forecast, lastAttemptAt: stamp, lastSuccessAt: i === 2 ? null : stamp, nextRefreshAt: null, error: null },
    supply: { available: true, sessionIds: [sessions[i].id], sessionCount: 1, totalLiters: '1000.00', reservedLiters: '200.00', collectedLiters: '100.00', remainingLiters: '700.00', observedAt: stamp, capacityPercentage: null },
    days: days.map(date => ({ date, temperature: i === 2 ? null : 32, temperatureSeverity: null, supplySeverity: null, status: 'unavailable', incomplete: true })),
  })),
};
export function serviceOperationsFixture(endpoint: string, params: URLSearchParams) {
  if (endpoint === '/staff/incidents') return incidents;
  if (endpoint.startsWith('/staff/incidents/')) return incidents.find(item => item.id === endpoint.split('/').at(-1));
  if (endpoint === '/staff/advisories') return advisories;
  if (endpoint.startsWith('/staff/advisories/')) return advisories.find(item => item.id === endpoint.split('/').at(-1));
  if (endpoint === '/staff/assistance-requests') return assistance.filter(item => (!params.get('type') || item.type === params.get('type')) && (!params.get('status') || item.status === params.get('status')));
  if (endpoint.startsWith('/staff/assistance-requests/')) return assistance.find(item => item.id === endpoint.split('/').at(-1));
  if (endpoint === '/staff/pickup-sites') return sites;
  if (endpoint === '/staff/distribution/sessions') return sessions;
  if (endpoint === '/staff/distribution/monitoring') return monitoring;
  if (endpoint === '/weather/psgc-locations') return locations;
  if (endpoint === '/weather') return forecast;
  return reportsWorkspaceFixture(endpoint, params);
}
