import { Image } from 'expo-image';
import { Text, View } from 'react-native';

export function Brand() {
  return <View accessible accessibilityLabel="Aqours" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Image source={require('../../assets/images/aqours-q-logo.svg')} contentFit="contain" style={{ width: 30, height: 30 }} />
    <Text style={{ color: '#20312f', fontSize: 18, fontWeight: '700' }}>Aqours</Text>
  </View>;
}
