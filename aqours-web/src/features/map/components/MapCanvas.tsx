import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
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
  latest.current = { reports, areas, onBounds, onSelect };
  useEffect(() => {
    let alive = true;
    let map: MapLibreMap | undefined;
    void import('maplibre-gl').then(module => {
      if (!alive || !container.current) return;
      const maplibre = module;
      maplibre.setWorkerUrl(workerUrl);
      map = new maplibre.Map({
        container: container.current,
        style: import.meta.env.VITE_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
        center: [121.01, 14.6], zoom: 11, renderWorldCopies: false, attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl(), 'top-right');
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
        addLayers(map); updateLayers(map, latest.current.reports, latest.current.areas); boundsChanged();
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
        const id = event.features?.[0]?.properties.id;
        if (id) latest.current.onSelect(String(id));
      });
      map.on('click', 'area-fill', event => {
        const item = event.features?.[0];
        if (item && map) new maplibre.Popup().setLngLat(event.lngLat).setText(`${item.properties.name}${item.properties.demo ? ' · Demonstration' : ''}`).addTo(map);
      });
      for (const id of ['clusters', 'points', 'area-fill']) {
        map.on('mouseenter', id, () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', id, () => { if (map) map.getCanvas().style.cursor = ''; });
      }
    }).catch(() => { if (alive) setFailure(true); });
    return () => { alive = false; mapRef.current = undefined; map?.remove(); };
  }, []);
  useEffect(() => {
    if (mapRef.current?.getSource('reports')) updateLayers(mapRef.current, reports, areas);
  }, [reports, areas]);
  return <>{failure && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]" role="alert">The basemap or map rendering is unavailable. Use the report list below; the report service can still be available.</p>}
    <div ref={container} className="map h-[480px] [border:1px_solid_#b8c4ce] [margin:16px_0] bg-[#e2e8f0] [@media(max-width:_760px)]:h-[380px]" aria-label="Supplier report map" />
  </>;
}
