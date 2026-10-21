import { query } from '../services/http-client';

const reportKeys = ['category', 'status', 'from', 'to', 'zoneId', 'ownerId', 'priority', 'unlocated'];
const assistanceKeys = ['type', 'status', 'from', 'to', 'ownerId'];

export function useQueueFilters(section: 'reports' | 'assistance' | 'overview', params: URLSearchParams) {
  const keys = section === 'assistance' ? assistanceKeys : reportKeys;
  const filters = Object.fromEntries(keys.flatMap(key => params.get(key) ? [[key, params.get(key)!]] : []));
  const value = Number(params.get('offset') || 0);
  const offset = Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const navigate = (next: Record<string, string>, nextOffset = 0) => {
    window.location.hash = `/${section}${query({ ...next, ...(nextOffset ? { offset: nextOffset } : {}) })}`;
  };
  return { filters, offset, setFilters: (next: Record<string, string>) => navigate(next), setOffset: (next: number) => navigate(filters, next) };
}
