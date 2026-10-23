import { basemapConfig, type BasemapOptions } from '../../map/utils/basemap';
import type { MapStyle } from './distribution-state';
export function distributionBasemap(options: BasemapOptions, style: MapStyle) {
  const config = basemapConfig(options);
  if (options.tileUrl?.trim() || !options.apiKey?.trim()) return config;
  const names = { streets: 'osm-bright', light: 'positron', dark: 'dark-matter' };
  return { ...config, url: `https://maps.geoapify.com/v1/tile/${names[style]}/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(options.apiKey.trim())}` };
}

export function distributionMapStyles(options: BasemapOptions): { value: MapStyle; label: string }[] {
  if (options.tileUrl?.trim()) return [{ value: 'streets', label: 'Configured basemap' }];
  if (!options.apiKey?.trim()) return [{ value: 'streets', label: 'Basemap unavailable' }];
  return [{ value: 'streets', label: 'Streets' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
}
