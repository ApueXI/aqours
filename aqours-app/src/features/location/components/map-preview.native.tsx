import { isRunningInExpoGo } from 'expo';
import { Body } from '@/components/ui';

export function MapPreview(props: { latitude: number; longitude: number }) {
  if (isRunningInExpoGo()) return <Body muted>
    Map preview is unavailable in Expo Go. Latitude: {props.latitude}, longitude: {props.longitude}.
    Use an Aqours Android build for the interactive map.
  </Body>;

  // MapLibre and its street-map setup require native modules absent from Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MapLibrePreview } = require('./maplibre-preview.native') as typeof import('./maplibre-preview.native');
  return <MapLibrePreview {...props} />;
}
