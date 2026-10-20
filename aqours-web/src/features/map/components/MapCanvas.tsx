import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, GeoJSONSource, Popup } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import { streetMapStyle } from '@aqours/contracts';
import { reportPopup } from '../utils/report-popup';
import type { MapResponse } from '@aqours/contracts';
import { addLayers, updateLayers } from '../utils/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

export type Bounds = { west: number; south: number; east: number; north: number };
export function MapCanvas({ reports, areas, onBounds, onSelect }: { reports?: MapResponse; areas: FeatureCollection; onBounds: (bounds: Bounds) => void; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | undefined>(undefined);
  const latest = useRef({ reports, areas, onBounds, onSelect });
  const [failure, setFailure] = useState(false);
  const [visibility, setVisibility] = useState({ reports: true, zone: true, incident: true, advisory: true });
  const visible = useRef(visibility); visible.current = visibility;
  const applyVisibility = (map: MapLibreMap) => {
    if (!map.getLayer('points')) return;
    for (const id of ['points', 'clusters', 'cluster-count']) map.setLayoutProperty(id, 'visibility', visible.current.reports ? 'visible' : 'none');
    for (const id of ['area-fill', 'area-outline']) map.setFilter(id, ['in', ['get', 'kind'], ['literal', Object.entries(visible.current).filter(([key, value]) => key !== 'reports' && value).map(([key]) => key)]]);
  };
  latest.current = { reports, areas, onBounds, onSelect };
  useEffect(() => {
    let alive = true;
    let map: MapLibreMap | undefined;
    let popup: Popup | undefined;
    void import('maplibre-gl').then(module => {
      if (!alive || !container.current) return;
      const maplibre = module;
      maplibre.setWorkerUrl(workerUrl);
      map = new maplibre.Map({
        container: container.current,
        style: import.meta.env.VITE_MAP_STYLE_URL || streetMapStyle(import.meta.env.VITE_MAP_TILE_URL || undefined),
        center: [121.01, 14.6], zoom: 11, renderWorldCopies: false, attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl(), 'top-right');
      map.addControl(new maplibre.ScaleControl({ unit: 'metric' }));
      map.addControl(new maplibre.AttributionControl({ compact: false, customAttribution: import.meta.env.VITE_MAP_ATTRIBUTION || undefined }));
      map.on('error', () => { if (alive) setFailure(true); });
      const boundsChanged = () => {
        const b = map?.getBounds();
        if (!b) return;
        const west = Math.max(-180, b.getWest()), east = Math.min(180, b.getEast());
        const south = Math.max(-90, b.getSouth()), north = Math.min(90, b.getNorth());
        if (west < east && south < north) latest.current.onBounds({ west, south, east, north });
      };
      map.on('load', () => {
        if (!map || !alive) return;
        addLayers(map); updateLayers(map, latest.current.reports, latest.current.areas); applyVisibility(map); boundsChanged();
      });
      map.on('moveend', boundsChanged);
      map.on('click', 'clusters', async event => {
        const feature = event.features?.[0];
        if (!map || !feature) return;
        try {
          const zoom = await (map.getSource('reports') as GeoJSONSource).getClusterExpansionZoom(Number(feature.properties.cluster_id));
          map.easeTo({ center: (feature.geometry as Point).coordinates as [number, number], zoom });
        } catch { setFailure(true); }
      });
      map.on('click', 'points', event => {
        const properties = event.features?.[0]?.properties as MapResponse['features'][number]['properties'] | undefined;
        if (properties && map) {
          popup?.remove();
          popup = new maplibre.Popup().setLngLat(event.lngLat).setDOMContent(reportPopup(properties, id => latest.current.onSelect(id))).addTo(map);
        }
      });
      map.on('click', 'area-fill', event => {
        // Report and cluster clicks take precedence over the underlying area.
        if (!map || map.queryRenderedFeatures(event.point, { layers: ['points', 'clusters'] }).length) return;
        const item = event.features?.[0];
        if (item) {
          popup?.remove();
          popup = new maplibre.Popup().setLngLat(event.lngLat).setText(`${item.properties.name}${item.properties.demo ? ' · Demonstration' : ''}`).addTo(map);
        }
      });
      for (const id of ['clusters', 'points', 'area-fill']) {
        map.on('mouseenter', id, () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', id, () => { if (map) map.getCanvas().style.cursor = ''; });
      }
    }).catch(() => { if (alive) setFailure(true); });
    return () => { alive = false; mapRef.current = undefined; popup?.remove(); map?.remove(); };
  }, []);
  useEffect(() => {
    if (mapRef.current?.getSource('reports')) updateLayers(mapRef.current, reports, areas);
  }, [reports, areas]);
  useEffect(() => { if (mapRef.current) applyVisibility(mapRef.current); }, [visibility]);
  return <><div className="flex flex-wrap gap-[12px] items-center" aria-label="Map layers">
    {Object.entries(visibility).map(([key, value]) => <label key={key}><input type="checkbox" checked={value}
      onChange={event => setVisibility(previous => ({ ...previous, [key]: event.target.checked }))} /> {({ reports: 'Reports', zone: 'Service zones', incident: 'Incident areas', advisory: 'Advisory areas' } as Record<string, string>)[key]}</label>)}
    <button onClick={() => mapRef.current?.easeTo({ center: [121.01, 14.6], zoom: 11, bearing: 0, pitch: 0 })}>Reset view</button>
  </div>{failure && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]" role="alert">The basemap or map rendering is unavailable. Use the report list below; the report service can still be available.</p>}
    <div ref={container} className="map h-[480px] [border:1px_solid_#b8c4ce] [margin:16px_0] bg-[#e2e8f0] [@media(max-width:_760px)]:h-[380px]" aria-label="Supplier report map" />
  </>;
}
