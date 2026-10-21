import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { weatherLocationLabel, type Connection, type WeatherLocation } from '@aqours/contracts';
import { Body, Button, ErrorNotice, Section, styles } from '@/components/ui';
import { WeatherSearch } from './weather-search';
import { WeatherForecastView } from './weather-forecast';

type Selection = { kind: 'connection'; id: string } | { kind: 'city'; location: WeatherLocation };

export function WeatherSection({ connections }: { connections: Connection[] | null }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const first = connections?.find(item => item.latitude !== null && item.longitude !== null) ?? connections?.[0];
  const selected = selection ?? (first ? { kind: 'connection' as const, id: first.id } : null);
  const connection = selected?.kind === 'connection' ? connections?.find(item => item.id === selected.id) : undefined;
  const city = selected?.kind === 'city' ? selected.location : null;
  const path = city ? `/weather?latitude=${city.latitude}&longitude=${city.longitude}`
    : connection && connection.latitude !== null && connection.longitude !== null ? `/weather?connectionId=${connection.id}` : null;
  const location = city ? weatherLocationLabel(city) : connection ? `${connection.reference} · ${connection.address}` : '';
  return <Section title="Weather">
    {!!connections?.length && <View style={{ gap: 8 }}>
      <Body muted>Weather location</Body>
      {connections.map(item => <Button key={item.id} title={`${item.reference} · ${item.address}`} secondary
        selected={selected?.kind === 'connection' && selected.id === item.id}
        onPress={() => setSelection({ kind: 'connection', id: item.id })} />)}
    </View>}
    {connection && !path && <Body muted>This connection has no coordinates. Search for a city to check its weather.</Body>}
    {!connection && !city && <Body muted>Search for a city to check current weather and the next seven days.</Body>}
    <WeatherSearch onSelect={value => setSelection({ kind: 'city', location: value })} />
    {path && <WeatherForecastView key={path} path={path} location={location} />}
    <Text accessibilityRole="link" style={[styles.muted, { textDecorationLine: 'underline' }]} onPress={() => {
      setLinkError(null);
      void Linking.openURL('https://open-meteo.com/').catch(() => setLinkError('Could not open Open-Meteo. Try again.'));
    }}>Weather data by Open-Meteo</Text>
    <ErrorNotice error={linkError} />
    <Body muted>City search by GeoNames. Forecasts are estimates. Check supplier advisories for water service updates.</Body>
  </Section>;
}
