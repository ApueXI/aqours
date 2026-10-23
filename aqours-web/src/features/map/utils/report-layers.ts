import L from 'leaflet';
import 'leaflet.markercluster';
import type { FeatureCollection } from 'geojson';
import type { Report } from '@aqours/contracts';
import { reportCategories } from './report-categories';
import { clusterSummary, reportSymbol } from './report-symbols';
import { markerLabel, pointPopup } from './customer-popup';
import { reportPoint, type CustomerMapData, type CustomerPoint } from './customer-points';

export type Visibility = { reports: boolean; zone: boolean; incident: boolean; advisory: boolean };
type Properties = CustomerPoint;
const colors: Record<string, string> = { zone: '#64748b', incident: '#0f766e', advisory: '#b45309' };
/** Reconcile markers so viewport refetches preserve open popups and spiderfied points. */
export function createReportLayers(map: L.Map, onSelect: (id: string) => void, onOpen: (id: string) => void) {
  let active = true;
  // Cluster layer removal can leave an already-open child popup on the map.
  const closePopups = (except?: L.Popup) => map.eachLayer(layer => {
    if (layer instanceof L.Popup && layer !== except) map.closePopup(layer);
  });
  const popupOpened = (event: L.PopupEvent) => closePopups(event.popup);
  map.on('popupopen', popupOpened);
  const reports = L.markerClusterGroup({
    maxClusterRadius: 45, spiderfyOnMaxZoom: true, showCoverageOnHover: false, animate: false,
    spiderfyDistanceMultiplier: 1.5,
    iconCreateFunction: cluster => {
      const children = cluster.getAllChildMarkers();
      const entries = children.map(marker => marker.options as L.MarkerOptions & { customerPoint: CustomerPoint });
      const count = new Set(entries.map(entry => entry.customerPoint.customerId)).size;
      const summary = clusterSummary(entries.flatMap(entry => {
        const category = entry.customerPoint.clusterCategory ?? entry.customerPoint.category;
        return category ? [category] : [];
      }), count);
      return L.divIcon({ className: 'report-cluster', html: `<span style="background-color:${summary.color}" role="img" aria-label="${summary.label}">${count}</span>`, iconSize: [44, 44] });
    },
  }).addTo(map);
  const markers = new Map<string, { marker: L.Marker; signature: string; coordinates: [number, number]; properties: Properties }>();
  let selectionPopup: L.Popup | undefined;
  const areas = L.geoJSON(undefined, {
    style: feature => ({ color: colors[feature?.properties?.kind] || colors.zone, weight: 2, fillOpacity: 0.08 }),
    onEachFeature: (feature, layer) => {
      const content = document.createElement('p');
      content.textContent = `${feature.properties?.name || 'Published area'}${feature.properties?.demo ? ' · Demonstration' : ''}`;
      layer.bindPopup(content);
    },
  }).addTo(map);
  let areaData: FeatureCollection | undefined;
  let visibility: Visibility = { reports: true, zone: true, incident: true, advisory: true };
  const showAreas = () => {
    areas.clearLayers();
    if (areaData) {
      const filtered: FeatureCollection = { ...areaData, features: areaData.features.filter(feature => visibility[feature.properties?.kind as keyof Visibility]) };
      areas.addData(filtered);
    }
  };
  const markerIcon = (properties: Properties) => {
    const color = properties.category ? reportCategories[properties.category].color : '#475569';
    const symbol = properties.category ? reportSymbol(properties.category) : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg>';
    return L.divIcon({ className: 'report-marker', html: `<span style="background-color:${color}">${symbol}</span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
  };
  const markerFor = (properties: Properties, coordinates: [number, number]) => {
    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: markerLabel(properties), alt: markerLabel(properties),
      icon: markerIcon(properties),
      ...{ customerPoint: properties },
    });
    marker.bindPopup(pointPopup(properties, onOpen));
    marker.on('click', () => { if (active && properties.report) onSelect(properties.report.id); });
    return marker;
  };
  return {
    update(data: CustomerMapData | undefined, nextAreas: FeatureCollection, selected?: Report) {
      const features = new Map((data?.points || []).map(point => [point.id, point]));
      const selectedFeature = selected && reportPoint(selected);
      if (selectedFeature) {
        for (const [id, point] of features) if (point.customerId === selectedFeature.customerId) {
          selectedFeature.clusterCategory = point.category; selectedFeature.reference = point.reference; features.delete(id);
        }
        features.set(selectedFeature.id, selectedFeature);
      }
      for (const [id, entry] of markers) {
        if (!features.has(id)) { entry.marker.closePopup(); reports.removeLayer(entry.marker); markers.delete(id); }
      }
      for (const [id, feature] of features) {
        const signature = JSON.stringify(feature);
        const current = markers.get(id);
        if (current?.signature === signature) continue;
        const coordinates = feature.coordinates;
        // Spiderfying temporarily moves marker coordinates; compare persisted points.
        if (current && current.coordinates[0] === coordinates[0] && current.coordinates[1] === coordinates[1]) {
          current.marker.setPopupContent(pointPopup(feature, onOpen));
          current.marker.options.title = markerLabel(feature);
          current.marker.options.alt = markerLabel(feature);
          Object.assign(current.marker.options, { customerPoint: feature });
          current.marker.setIcon(markerIcon(feature));
          current.signature = signature;
          current.properties = feature;
          continue;
        }
        if (current) { current.marker.closePopup(); reports.removeLayer(current.marker); }
        const marker = markerFor(feature, feature.coordinates);
        markers.set(id, { marker, signature, coordinates, properties: feature }); reports.addLayer(marker);
      }
      if (selectedFeature && selectionPopup && map.hasLayer(selectionPopup)) {
        selectionPopup.setContent(pointPopup(selectedFeature, onOpen));
      }
      reports.refreshClusters();
      if (areaData !== nextAreas) { areaData = nextAreas; showAreas(); }
    },
    select(id: string) {
      const entry = markers.get(id);
      if (!entry || !map.hasLayer(reports)) return;
      const { marker, coordinates, properties } = entry;
      const point = L.latLng(coordinates[1], coordinates[0]);
      if (!map.getBounds().contains(point)) map.panTo(point, { animate: false });
      const parent = reports.getVisibleParent(marker);
      if (parent instanceof L.MarkerCluster) parent.spiderfy();
      // Selection belongs to the record, so viewport reconciliation must not remove its popup.
      selectionPopup ??= L.popup({ autoPan: true, autoPanPadding: [16, 16] });
      selectionPopup.setLatLng(point).setContent(pointPopup(properties, onOpen)).openOn(map);
    },
    visibility(next: Visibility) {
      visibility = next;
      if (!next.reports) closePopups();
      if (next.reports) reports.addTo(map); else map.removeLayer(reports);
      showAreas();
    },
    destroy() {
      active = false; reports.off(); map.off('popupopen', popupOpened); closePopups();
    },
  };
}
