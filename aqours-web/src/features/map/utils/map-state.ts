import { query } from '../../../services/http-client';

const filterKeys = ['category', 'status', 'from', 'to', 'zoneId', 'ownerId', 'priority'];
export function mapFilters(params: URLSearchParams) {
  return Object.fromEntries(filterKeys.flatMap(key => {
    const value = params.get(key);
    return value ? [[key, value]] : [];
  }));
}

export function mapLocation(filters: Record<string, string>, state: { selected?: string; view?: string; unlocated?: boolean } = {}) {
  return `/map${query({ ...filters, selected: state.selected, view: state.view === 'map' ? 'map' : undefined, unlocated: state.unlocated ? '1' : undefined })}`;
}
