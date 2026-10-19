import { Body } from '@/components/ui';

export function MapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  return <Body muted>Native MapLibre preview is available in the Android build. Coordinates: {latitude}, {longitude}.</Body>;
}
