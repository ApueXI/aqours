import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Body, Button } from '@/components/ui';
import { mapStyleUrl } from '@/lib/api';

export function MapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [failed, setFailed] = useState(false);
  if (!mapStyleUrl || failed) return <>
    <Body muted>{failed ? 'The map could not load.' : 'Map style is not configured.'} You can confirm the address and coordinates or continue with an address only.</Body>
    {failed && <Button title="Retry map" secondary onPress={() => setFailed(false)} />}
  </>;
  return <View style={{ height: 240 }} accessibilityLabel={`Issue location latitude ${latitude}, longitude ${longitude}`}>
    <Map style={{ flex: 1 }} mapStyle={mapStyleUrl} onDidFailLoadingMap={() => setFailed(true)}>
      <Camera initialViewState={{ center: [longitude, latitude], zoom: 15 }} />
      <ViewAnnotation lngLat={[longitude, latitude]}><Text style={{ color: '#9f2d22', fontSize: 30 }}>◆</Text></ViewAnnotation>
    </Map>
  </View>;
}
