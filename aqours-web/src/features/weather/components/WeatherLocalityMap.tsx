import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { WeatherPsgcLocation } from '@aqours/contracts';
import { basemapConfig } from '../../map/utils/basemap';
import { defaultMapCenter, defaultMapZoom } from '../../map/utils/default-view';
import { hasWeatherPoint } from '../utils/psgc-hierarchy';
import { createWeatherMarkers } from '../utils/weather-markers';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '../../map/map.css';

const config = basemapConfig({ apiKey: import.meta.env.VITE_GEOAPIFY_MAPS_API_KEY,
  tileUrl: import.meta.env.VITE_MAP_TILE_URL, attribution: import.meta.env.VITE_MAP_ATTRIBUTION,
  legacyStyleUrl: import.meta.env.VITE_MAP_STYLE_URL });
type Runtime = { map: L.Map; markers: ReturnType<typeof createWeatherMarkers>; tiles?: L.TileLayer };
export function WeatherLocalityMap({ locations, selected, scope, onSelect, onReset }: {
  locations: WeatherPsgcLocation[]; selected: string; scope: string; onSelect: (code: string) => void; onReset: () => void;
}) {
  const container = useRef<HTMLDivElement>(null), runtime = useRef<Runtime | undefined>(undefined);
  const latest = useRef({ onSelect }); latest.current = { onSelect };
  const [failure, setFailure] = useState<string | null>(config.notice);
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    const map = L.map(container.current, { center: defaultMapCenter, zoom: defaultMapZoom, minZoom: 3, maxZoom: 18,
      zoomControl: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    L.control.zoom({ position: 'topright' }).addTo(map); L.control.scale({ imperial: false }).addTo(map);
    let tiles: L.TileLayer | undefined;
    if (config.url) {
      tiles = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 18, noWrap: true }).addTo(map);
      let failed = false;
      tiles.on('loading', () => { failed = false; });
      tiles.on('tileerror', () => { failed = true; if (active) setFailure('Street tiles could not load. Locality markers and location selectors remain available.'); });
      tiles.on('load', () => { if (active && !failed) setFailure(null); });
    }
    const markers = createWeatherMarkers(map, code => latest.current.onSelect(code));
    runtime.current = { map, markers, tiles };
    const observer = new ResizeObserver(() => {
      if (active) { map.invalidateSize({ pan: false }); markers.resize(); }
    }); observer.observe(container.current);
    return () => { active = false; observer.disconnect(); runtime.current = undefined; tiles?.off(); markers.destroy(); map.stop(); map.remove(); };
  }, []);
  useEffect(() => { runtime.current?.markers.update(locations, selected); }, [locations]);
  useEffect(() => {
    const map = runtime.current?.map;
    if (!map) return;
    const points = locations.filter(hasWeatherPoint).map(location => [location.latitude, location.longitude] as [number, number]);
    if (scope && points.length) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 11, animate: false });
    else if (!scope) map.setView(defaultMapCenter, defaultMapZoom);
  }, [scope, locations]);
  useEffect(() => { runtime.current?.markers.select(selected); }, [selected, locations]);
  return <div className="weather-locality-map">
    <div className="map-layer-toolbar"><span>City and municipality weather points</span>
      <button type="button" onClick={() => { onReset(); runtime.current?.map.setView(defaultMapCenter, defaultMapZoom); }}>Reset weather map</button>
    </div>
    {failure && <div className="notice map-provider-notice" role="alert"><p>{failure}</p>
      {config.url && <button type="button" onClick={() => { setFailure(null); runtime.current?.tiles?.redraw(); }}>Retry basemap</button>}</div>}
    <div ref={container} className="leaflet-weather-map" role="region" aria-label="Weather locality map" />
    {locations.length > 0 && !locations.some(hasWeatherPoint) && <p role="status">No available weather points in this area. Select another area.</p>}
  </div>;
}
