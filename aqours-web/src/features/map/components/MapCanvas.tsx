import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
import type { MapResponse, Report } from '@aqours/contracts';
import { basemapConfig } from '../utils/basemap';
import { createReportLayers, type Visibility } from '../utils/report-layers';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '../map.css';

export type Bounds = { west: number; south: number; east: number; north: number };
const initialCenter: L.LatLngExpression = [14.6, 121.01];
const config = basemapConfig({ apiKey: import.meta.env.VITE_GEOAPIFY_MAPS_API_KEY,
  tileUrl: import.meta.env.VITE_MAP_TILE_URL, attribution: import.meta.env.VITE_MAP_ATTRIBUTION,
  legacyStyleUrl: import.meta.env.VITE_MAP_STYLE_URL });
const layerLabels = { reports: 'Reports', zone: 'Service zones', incident: 'Incident areas', advisory: 'Advisory areas' };

export function MapCanvas({ reports, areas, selected, focusKey, onBounds, onSelect, onOpen }: {
  reports?: MapResponse; areas: FeatureCollection; selected?: Report; focusKey: number;
  onBounds: (bounds: Bounds) => void; onSelect: (id: string) => void; onOpen: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ map: L.Map; layers: ReturnType<typeof createReportLayers>; tiles?: L.TileLayer } | undefined>(undefined);
  const latest = useRef({ reports, areas, selected, onBounds, onSelect, onOpen });
  latest.current = { reports, areas, selected, onBounds, onSelect, onOpen };
  const [failure, setFailure] = useState<string | null>(config.notice);
  const [visibility, setVisibility] = useState<Visibility>({ reports: true, zone: true, incident: true, advisory: true });
  const visibilityRef = useRef(visibility); visibilityRef.current = visibility;
  const retry = () => {
    if (runtime.current?.tiles) { setFailure(null); runtime.current.tiles.redraw(); }
  };

  useEffect(() => {
    if (!container.current) return;
    let active = true;
    const map = L.map(container.current, { center: initialCenter, zoom: 11, minZoom: 3, maxZoom: 20,
      maxBounds: [[-85, -180], [85, 180]], maxBoundsViscosity: 1, zoomControl: false,
      zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    let tiles: L.TileLayer | undefined;
    if (config.url) {
      tiles = L.tileLayer(config.url, { attribution: config.attribution, maxZoom: 20, noWrap: true }).addTo(map);
      tiles.on('tileerror', () => { if (active) setFailure('Street tiles could not load. Retry the basemap or continue with the report list.'); });
    }
    const layers = createReportLayers(map, id => latest.current.onSelect(id), id => latest.current.onOpen(id));
    layers.update(latest.current.reports, latest.current.areas, latest.current.selected);
    layers.visibility(visibilityRef.current);
    runtime.current = { map, layers, tiles };
    if (latest.current.selected) layers.select(latest.current.selected.id);
    const boundsChanged = () => {
      if (!active) return;
      const bounds = map.getBounds();
      const west = Math.max(-180, bounds.getWest()), east = Math.min(180, bounds.getEast());
      const south = Math.max(-90, bounds.getSouth()), north = Math.min(90, bounds.getNorth());
      if (west < east && south < north) latest.current.onBounds({ west, south, east, north });
    };
    map.on('moveend', boundsChanged); boundsChanged();
    const observer = new ResizeObserver(() => { if (active) map.invalidateSize({ pan: false }); });
    observer.observe(container.current);
    return () => {
      active = false; observer.disconnect(); runtime.current = undefined;
      map.off('moveend', boundsChanged); layers.destroy(); map.stop(); map.remove();
    };
  }, []);
  useEffect(() => { runtime.current?.layers.update(reports, areas, selected); }, [reports, areas, selected]);
  useEffect(() => {
    if (selected) runtime.current?.layers.select(selected.id);
    else runtime.current?.map.closePopup();
  }, [selected?.id, focusKey]);
  useEffect(() => { runtime.current?.layers.visibility(visibility); }, [visibility]);

  return <div className="operational-map">
    <div className="map-layer-toolbar" aria-label="Map layers">
      {Object.entries(visibility).map(([key, value]) => <label key={key}><input type="checkbox" checked={value}
        onChange={event => setVisibility(previous => ({ ...previous, [key]: event.target.checked }))} />{layerLabels[key as keyof Visibility]}</label>)}
      <button type="button" onClick={() => runtime.current?.map.setView(initialCenter, 11)}>Reset view</button>
    </div>
    {failure && <div className="notice map-provider-notice" role="alert"><p>{failure} Report locations remain available independently of street tiles.</p>
      {config.url && <button type="button" onClick={retry}>Retry basemap</button>}</div>}
    <div ref={container} className="map leaflet-report-map" aria-label="Supplier report map" />
  </div>;
}
