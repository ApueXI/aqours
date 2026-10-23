import type { MonitoredSite } from '@aqours/contracts';

export type DistributionTab = 'monitoring' | 'sessions' | 'sites' | 'warnings';
export type MapStyle = 'streets' | 'light' | 'dark';
export function manilaToday(now = new Date()) { return new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 10); }
const oneOf = <T extends string>(value: string | null, choices: readonly T[], fallback: T): T => choices.includes(value as T) ? value as T : fallback;
export function distributionState(params: URLSearchParams, dates?: string[]) {
  const today = dates?.[0] || manilaToday();
  const requestedDate = params.get('date') || today;
  return {
    tab: oneOf(params.get('tab'), ['monitoring', 'sessions', 'sites', 'warnings'] as const, 'monitoring'),
    date: dates ? (dates.includes(requestedDate) ? requestedDate : today) : (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today),
    siteId: params.get('siteId') || '', q: params.get('q') || '',
    status: oneOf(params.get('status'), ['normal', 'warning', 'critical', 'unavailable', ''] as const, ''),
    view: oneOf(params.get('view'), ['list', 'map'] as const, 'list'),
    style: oneOf(params.get('style'), ['streets', 'light', 'dark'] as const, 'streets'),
    temperature: params.get('temperature') !== '0',
  };
}
export function distributionLink(params: URLSearchParams, values: Record<string, string>) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); }
  return `#/distribution${next.size ? `?${next}` : ''}`;
}
export function selectedDay(item: MonitoredSite, date: string) { return item.days.find(day => day.date === date); }
export function filterMonitoredSites(sites: MonitoredSite[], date: string, status: string, q: string) {
  const text = q.trim().toLowerCase();
  return sites.filter(item => (!status || (selectedDay(item, date)?.status || 'unavailable') === status) &&
    (!text || `${item.site.name} ${item.site.address}`.toLowerCase().includes(text)));
}
export const statusColors = { normal: '#15803d', warning: '#eab308', critical: '#dc2626', unavailable: '#6b7280' };
export const temperatureColors = ['#2563eb', '#15803d', '#eab308', '#ea580c', '#dc2626'];
export function temperatureColor(temperature: number, bands: number[]) {
  return temperatureColors[bands.filter(boundary => temperature >= boundary).length] || temperatureColors[4];
}
