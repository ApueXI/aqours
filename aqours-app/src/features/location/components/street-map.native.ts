import { TransformRequestManager } from '@maplibre/maplibre-react-native';
import { streetMapStyle } from '@aqours/contracts';
import { mapStyleUrl } from '@/services/http-client';

TransformRequestManager.addHeader({
  id: 'aqours-osm-identification', match: '^https://tile\\.openstreetmap\\.org/',
  name: 'User-Agent', value: 'Aqours/1.0 (Android water supply reporting)',
});
export const previewStyle = mapStyleUrl || streetMapStyle(process.env.EXPO_PUBLIC_MAP_TILE_URL || undefined);
