import L from 'leaflet';
import 'leaflet.markercluster';
import type { WeatherPsgcLocation } from '@aqours/contracts';
import { hasWeatherPoint, psgcWeatherLabel } from './psgc-hierarchy';

export function weatherMarkerIcon(selected: boolean) {
  return L.divIcon({ className: `weather-locality-marker${selected ? ' weather-locality-selected' : ''}`,
    html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
}

function popupOptions(map: L.Map): L.PopupOptions {
  // Leaflet adds 46px of margins/padding to its content width. Keep a 12px
  // left gutter and 64px on the right so the close control avoids map zoom.
  const size = map.getSize();
  return { className: 'weather-locality-popup', maxWidth: Math.min(300, Math.max(50, size.x - 122)),
    maxHeight: Math.max(80, size.y - 64), autoPanPaddingTopLeft: L.point(12, 12),
    autoPanPaddingBottomRight: L.point(64, 12) };
}

export function createWeatherMarkers(map: L.Map, onSelect: (code: string) => void) {
  const cluster = L.markerClusterGroup({ animate: false, showCoverageOnHover: false,
    iconCreateFunction: group => L.divIcon({ className: 'weather-locality-cluster', html: String(group.getChildCount()), iconSize: [40, 40] }) }).addTo(map);
  const markers = new Map<string, L.Marker>();
  let keyboardFocusCode: string | undefined;
  return {
    update(locations: WeatherPsgcLocation[], selected: string) {
      cluster.clearLayers(); markers.clear();
      const layers: L.Marker[] = [];
      for (const location of locations) {
        if (!hasWeatherPoint(location)) continue;
        const label = psgcWeatherLabel(location);
        const marker = L.marker([location.latitude, location.longitude], { title: label, alt: label,
          icon: weatherMarkerIcon(location.code === selected) });
        const popup = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = label; popup.append(title);
        const note = document.createElement('p'); note.textContent = 'Approximate locality point for weather. Not a water-service boundary.'; popup.append(note);
        marker.bindPopup(popup, popupOptions(map));
        marker.on('click', () => { keyboardFocusCode = undefined; onSelect(location.code); });
        marker.on('keydown', event => {
          const key = event.originalEvent;
          if (key.key !== 'Enter' && key.key !== ' ') return;
          // Suppress Leaflet's separate Enter keypress popup toggle and Space
          // scrolling. Both keys activate the same canonical selection once.
          L.DomEvent.stop(key);
          if (key.repeat) return;
          keyboardFocusCode = location.code;
          onSelect(location.code);
        });
        markers.set(location.code, marker); layers.push(marker);
      }
      cluster.addLayers(layers);
    },
    select(code: string) {
      const restoreFocus = keyboardFocusCode === code;
      keyboardFocusCode = undefined;
      for (const [id, marker] of markers) marker.setIcon(weatherMarkerIcon(code === id));
      const marker = markers.get(code);
      if (marker) {
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 11), { animate: false });
        cluster.zoomToShowLayer(marker, () => {
          if (markers.get(code) !== marker || !map.hasLayer(marker)) return;
          marker.openPopup();
          if (restoreFocus) marker.getElement()?.focus({ preventScroll: true });
        });
      }
      else map.closePopup();
    },
    resize() {
      const options = popupOptions(map);
      for (const marker of markers.values()) {
        const popup = marker.getPopup();
        if (!popup) continue;
        Object.assign(popup.options, options);
        if (popup.isOpen()) popup.update();
      }
    },
    destroy() { cluster.clearLayers(); markers.clear(); cluster.remove(); },
  };
}
