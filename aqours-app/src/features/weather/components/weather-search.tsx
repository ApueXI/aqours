import { useState } from 'react';
import { View } from 'react-native';
import { weatherLocationLabel, type WeatherLocation } from '@aqours/contracts';
import { Button, Field, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';

function SearchResults({ query, onSelect }: { query: string; onSelect(location: WeatherLocation): void }) {
  const resource = useResource<WeatherLocation[]>(`/weather/locations?q=${encodeURIComponent(query)}`);
  return <View style={{ gap: 8 }}>
    <ResourceState {...resource} empty={resource.data?.length === 0 && 'No matching cities. Try another city name.'} />
    {resource.data?.map(location => <Button key={location.id} title={weatherLocationLabel(location)} secondary onPress={() => onSelect(location)} />)}
  </View>;
}

export function WeatherSearch({ onSelect }: { onSelect(location: WeatherLocation): void }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState<{ query: string; run: number } | null>(null);
  const submit = () => {
    const query = input.trim();
    if (query.length >= 2) setSearch(previous => ({ query, run: (previous?.run ?? 0) + 1 }));
  };
  return <View style={{ gap: 12 }}>
    <Field label="City in the Philippines" value={input} onChangeText={setInput} maxLength={100} placeholder="e.g. Manila" returnKeyType="search" onSubmitEditing={submit} />
    <View style={styles.row}><Button title="Search weather cities" secondary disabled={input.trim().length < 2} onPress={submit} /></View>
    {search && search.query === input.trim() && <SearchResults key={search.run} query={search.query} onSelect={location => {
      onSelect(location); setSearch(null);
    }} />}
  </View>;
}
