import type { Category, MapResponse } from '@aqours/contracts';

export const reportCategories: Record<Category, { label: string; color: string }> = {
  outage: { label: 'No water', color: '#dc2626' },
  leak: { label: 'Leak', color: '#2563eb' },
  low_pressure: { label: 'Low pressure', color: '#b45309' },
  water_quality: { label: 'Water quality', color: '#7c3aed' },
};

export function reportMarkerLabel(properties: MapResponse['features'][number]['properties']) {
  return `${properties.reference} · ${reportCategories[properties.category].label} · ${properties.priority} priority`;
}
