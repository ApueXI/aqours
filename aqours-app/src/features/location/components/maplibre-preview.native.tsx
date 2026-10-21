import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Body, Button } from '@/components/ui';
import { previewStyle } from './street-map.native';

export function MapLibrePreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>
    <Body muted>The map could not load. You can confirm the address and coordinates or continue with an address only.</Body>
    {failed && <Button title="Retry map" secondary onPress={() => setFailed(false)} />}
  </>;
  return <View style={{ height: 270 }} accessibilityLabel={`Issue location latitude ${latitude}, longitude ${longitude}`}>
    <Map style={{ flex: 1 }} mapStyle={previewStyle} attribution onDidFailLoadingMap={() => setFailed(true)}>
      <Camera initialViewState={{ center: [longitude, latitude], zoom: 15 }} />
      <GeoJSONSource id="issue-location" data={{ type: 'Point', coordinates: [longitude, latitude] }}>
        <Layer id="issue-location-point" type="circle" paint={{ 'circle-radius': 8, 'circle-color': '#9f2d22', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2 }} />
      </GeoJSONSource>
    </Map>
    <Text accessibilityRole="link" onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')} style={{ fontSize: 12, color: '#332a22', backgroundColor: '#ffffff' }}>© OpenStreetMap contributors</Text>
  </View>;
}
