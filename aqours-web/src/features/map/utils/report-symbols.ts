import type { Category } from '@aqours/contracts';
import { reportCategories } from './report-categories';

// Display precedence only; this never changes a report's reviewed priority.
export const categoryOrder: Category[] = ['outage', 'water_quality', 'leak', 'low_pressure'];

export function leadingCategory(categories: Iterable<Category>): Category | undefined {
  const present = new Set(categories);
  return categoryOrder.find(category => present.has(category));
}

const paths: Record<Category, string> = {
  outage: '<path d="M12 3C9 7 6 10 6 14a6 6 0 0 0 10 4M18 14c0-2-1-4-3-7M3 3l18 18"/>',
  leak: '<path d="M4 4v6h7V4M3 7h9M8 10v4h7v-3h5v5M17.5 17c-3 3-3 5 0 5s3-2 0-5Z"/>',
  low_pressure: '<path d="M4 15a8 8 0 1 1 16 0M12 7v2M6 10l2 2M18 10l-2 2M12 15l-4 3M4 21h16"/><circle cx="12" cy="15" r="1"/>',
  water_quality: '<path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12ZM12 10v5M12 18h.01"/>',
};

/** All SVG markup is static; record text must use textContent instead. */
export function reportSymbol(category: Category) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[category]}</svg>`;
}

export function clusterSummary(categories: Iterable<Category>, count: number) {
  const category = leadingCategory(categories);
  return { color: category ? reportCategories[category].color : '#475569',
    label: `${count} customers · ${category ? `Includes ${reportCategories[category].label.toLowerCase()} reports` : 'No open reports'} · Zoom in to inspect` };
}
