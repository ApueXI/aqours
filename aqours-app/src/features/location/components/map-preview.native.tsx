import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button } from '@/components/ui';
import { mapStyleUrl } from '@/services/http-client';

export function MapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [failed, setFailed] = useState(false);
  if (!mapStyleUrl || failed) return <>
    <Body muted>{failed ? 'The map could not load.' : 'Map style is not configured.'} You can confirm the address and coordinates or continue with an address only.</Body>
    {failed && <Button title="Retry map" secondary onPress={() => setFailed(false)} />}
  </>;
  return <View style={{ height: 240 }} accessibilityLabel={`Issue location latitude ${latitude}, longitude ${longitude}`}>
    <Map style={{ flex: 1 }} mapStyle={mapStyleUrl} onDidFailLoadingMap={() => setFailed(true)}>
      <Camera initialViewState={{ center: [longitude, latitude], zoom: 15 }} />
      <GeoJSONSource id="issue-location" data={{ type: 'Point', coordinates: [longitude, latitude] }}>
        <Layer id="issue-location-point" type="circle" paint={{ 'circle-radius': 8, 'circle-color': '#9f2d22', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 }} />
      </GeoJSONSource>
    </Map>
  </View>;
}
