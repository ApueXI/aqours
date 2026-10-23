import L from 'leaflet';
import 'leaflet.markercluster';
import type { FeatureCollection } from 'geojson';
import type { MapResponse, Report } from '@aqours/contracts';
import { reportPopup } from './report-popup';
import { reportCategories, reportMarkerLabel } from './report-categories';

export type Visibility = { reports: boolean; zone: boolean; incident: boolean; advisory: boolean };
type Properties = MapResponse['features'][number]['properties'];
const colors: Record<string, string> = { zone: '#64748b', incident: '#0f766e', advisory: '#b45309' };

export function reportFeature(report: Report): MapResponse['features'][number] | undefined {
  if (report.latitude === null || report.longitude === null) return;
  return { type: 'Feature', geometry: { type: 'Point', coordinates: [report.longitude, report.latitude] }, properties: {
    id: report.id, reference: report.reference, category: report.category, status: report.status, priority: report.priority,
    address: report.address, locationSource: report.locationSource, locationReview: report.locationReview,
  } };
}

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
    iconCreateFunction: cluster => L.divIcon({ className: 'report-cluster', html: `<span>${cluster.getChildCount()}</span>`, iconSize: [44, 44] }),
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
    const { color } = reportCategories[properties.category];
    return L.divIcon({ className: 'report-marker', html: `<span style="background-color:${color}"></span>`, iconSize: [44, 44], iconAnchor: [22, 22] });
  };
  const markerFor = (properties: Properties, coordinates: [number, number]) => {
    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: reportMarkerLabel(properties), alt: reportMarkerLabel(properties),
      icon: markerIcon(properties),
    });
    marker.bindPopup(reportPopup(properties, onOpen));
    marker.on('click', () => { if (active) onSelect(properties.id); });
    return marker;
  };
  return {
    update(data: MapResponse | undefined, nextAreas: FeatureCollection, selected?: Report) {
      const features = new Map((data?.features || []).map(feature => [feature.properties.id, feature]));
      const selectedFeature = selected && reportFeature(selected);
      if (selectedFeature) features.set(selectedFeature.properties.id, selectedFeature);
      for (const [id, entry] of markers) {
        if (!features.has(id)) { entry.marker.closePopup(); reports.removeLayer(entry.marker); markers.delete(id); }
      }
      for (const [id, feature] of features) {
        const signature = JSON.stringify(feature);
        const current = markers.get(id);
        if (current?.signature === signature) continue;
        const coordinates = feature.geometry.coordinates;
        // Spiderfying temporarily moves marker coordinates; compare persisted points.
        if (current && current.coordinates[0] === coordinates[0] && current.coordinates[1] === coordinates[1]) {
          current.marker.setPopupContent(reportPopup(feature.properties, onOpen));
          current.marker.options.title = reportMarkerLabel(feature.properties);
          current.marker.options.alt = reportMarkerLabel(feature.properties);
          current.marker.setIcon(markerIcon(feature.properties));
          current.signature = signature;
          current.properties = feature.properties;
          continue;
        }
        if (current) { current.marker.closePopup(); reports.removeLayer(current.marker); }
        const marker = markerFor(feature.properties, feature.geometry.coordinates);
        markers.set(id, { marker, signature, coordinates, properties: feature.properties }); reports.addLayer(marker);
      }
      if (selectedFeature && selectionPopup && map.hasLayer(selectionPopup)) {
        selectionPopup.setContent(reportPopup(selectedFeature.properties, onOpen));
      }
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
      selectionPopup ??= L.popup({ autoPan: false });
      selectionPopup.setLatLng(point).setContent(reportPopup(properties, onOpen)).openOn(map);
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
