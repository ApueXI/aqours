import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { MonitoredSite } from '@aqours/contracts';
import { defaultMapCenter, defaultMapZoom } from '../../map/utils/default-view';
import { distributionBasemap } from '../utils/distribution-basemap';
import { selectedDay, statusColors, temperatureColor, type MapStyle } from '../utils/distribution-state';
import { sitePopup } from '../utils/site-popup';
import 'leaflet/dist/leaflet.css';
import '../../map/map.css';

const options = { apiKey: import.meta.env.VITE_GEOAPIFY_MAPS_API_KEY, tileUrl: import.meta.env.VITE_MAP_TILE_URL,
  attribution: import.meta.env.VITE_MAP_ATTRIBUTION, legacyStyleUrl: import.meta.env.VITE_MAP_STYLE_URL };
type Runtime = { map: L.Map; markers: Map<string, L.Marker>; status: L.LayerGroup; temperature: L.LayerGroup; tiles?: L.TileLayer };
export function DistributionMap({ items, day, selectedId, onSelect, style, temperature, bands }: {
  items: MonitoredSite[]; day: string; selectedId: string; onSelect: (id: string) => void;
  style: MapStyle; temperature: boolean; bands: number[];
}) {
  const container = useRef<HTMLDivElement>(null), runtime = useRef<Runtime | undefined>(undefined);
  const latest = useRef({ onSelect, selectedId }); latest.current = { onSelect, selectedId };
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { center: defaultMapCenter, zoom: defaultMapZoom, minZoom: 3, maxZoom: 20,
      zoomControl: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    L.control.zoom({ position: 'topright' }).addTo(map); L.control.scale({ imperial: false }).addTo(map);
    map.createPane('siteTemperature').style.zIndex = '430';
    map.createPane('siteTemperatureLabels').style.zIndex = '450';
    runtime.current = { map, markers: new Map(), status: L.layerGroup().addTo(map), temperature: L.layerGroup().addTo(map) };
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false })); observer.observe(container.current);
    return () => { observer.disconnect(); runtime.current = undefined; map.stop(); map.remove(); };
  }, []);
  useEffect(() => {
    const current = runtime.current; if (!current) return;
    const config = distributionBasemap(options, style);
    current.tiles?.remove(); current.tiles = undefined;
    if (!config.url) return;
    const tiles = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 20, noWrap: true });
    let cycleFailed = false;
    tiles.on('loading', () => { cycleFailed = false; });
    tiles.on('tileerror', () => { cycleFailed = true; setFailure('Basemap tiles could not load. Site markers and the list remain available.'); });
    tiles.on('load', () => { if (!cycleFailed) setFailure(null); });
    current.tiles = tiles.addTo(current.map);
    return () => { tiles.off(); tiles.remove(); };
  }, [style]);
  useEffect(() => {
    const current = runtime.current; if (!current) return;
    current.status.clearLayers(); current.temperature.clearLayers(); current.markers.clear();
    for (const item of items) {
      if (item.site.latitude === null || item.site.longitude === null) continue;
      const point: L.LatLngExpression = [item.site.latitude, item.site.longitude], evaluation = selectedDay(item, day);
      const status = evaluation?.status || 'unavailable';
      const marker = L.marker(point, { title: `${item.site.name} · ${status}`, alt: `${item.site.name} · ${status}`,
        icon: L.divIcon({ className: 'distribution-site-marker', html: `<span style="background:${statusColors[status]}"></span>`, iconSize: [26, 26], iconAnchor: [13, 13] }) });
      marker.bindPopup(sitePopup(item, day), { maxWidth: 350, maxHeight: 380 });
      marker.on('click', () => latest.current.onSelect(item.site.id)); current.status.addLayer(marker); current.markers.set(item.site.id, marker);
      if (temperature && evaluation?.temperature !== null && evaluation?.temperature !== undefined) {
        const color = temperatureColor(evaluation.temperature, bands);
        const circle = L.circleMarker(point, { radius: 32, pane: 'siteTemperature', color, weight: 2, fillColor: color, fillOpacity: .22, interactive: false });
        circle.bindTooltip(`${evaluation.temperature.toFixed(1)}°C${item.weather.status === 'fresh' ? '' : ` · ${item.weather.status}`}`,
          { permanent: true, direction: 'bottom', offset: [0, 25], pane: 'siteTemperatureLabels', className: 'site-temperature-label' });
        current.temperature.addLayer(circle);
      }
    }
    current.markers.get(latest.current.selectedId)?.openPopup();
  }, [items, day, temperature, bands]);
  useEffect(() => {
    const marker = runtime.current?.markers.get(selectedId);
    if (marker) { runtime.current?.map.panTo(marker.getLatLng()); marker.openPopup(); }
    else runtime.current?.map.closePopup();
  }, [selectedId]);
  const config = distributionBasemap(options, style);
  return <div className="distribution-map"><div className="map-layer-toolbar"><span>Pickup sites</span>
    <button type="button" onClick={() => runtime.current?.map.setView(defaultMapCenter, defaultMapZoom)}>Reset distribution map</button></div>
    {(failure || config.notice) && <div className="notice map-provider-notice" role="alert"><p>{failure || config.notice}</p>
      {config.url && <button type="button" onClick={() => runtime.current?.tiles?.redraw()}>Retry basemap</button>}</div>}
    {options.tileUrl && <p className="hint">Configured custom basemap is in use.</p>}
    <div ref={container} className="leaflet-distribution-map" aria-label="Distribution monitoring map" />
  </div>;
}
