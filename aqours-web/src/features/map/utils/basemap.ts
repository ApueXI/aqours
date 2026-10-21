export interface BasemapOptions {
  apiKey?: string;
  tileUrl?: string;
  attribution?: string;
  legacyStyleUrl?: string;
}

const osm = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const geoapify = '<a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://openmaptiles.org/">OpenMapTiles</a>';

/** Browser keys are public map credentials; geocoding remains on the API. */
export function basemapConfig(options: BasemapOptions) {
  const template = options.tileUrl?.trim();
  const apiKey = options.apiKey?.trim();
  const url = template || (apiKey ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(apiKey)}` : null);
  const isGeoapify = Boolean(url?.startsWith('https://maps.geoapify.com/'));
  const attribution = [isGeoapify ? geoapify : '', osm, options.attribution].filter(Boolean).join(' | ');
  const notice = !url ? options.legacyStyleUrl
    ? 'The previous street map is unavailable. Your administrator needs to configure raster tiles for this workspace.'
    : 'Street tiles are not configured for this workspace. Your administrator can enable the basemap.' : null;
  return { url, attribution, notice };
}
