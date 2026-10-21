import { useState, type FormEvent } from 'react';
import { weatherLocationLabel, type WeatherLocation } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ResourceState } from '../../../components/Status';

function SearchResults({ query, onSelect }: { query: string; onSelect(location: WeatherLocation): void }) {
  const resource = useResource<WeatherLocation[]>(`/weather/locations?q=${encodeURIComponent(query)}`);
  return <ResourceState resource={resource}>
    {resource.data?.length === 0 && <p>No matching cities. Try another city name.</p>}
    <ul className="list-none p-0 flex flex-col gap-2" aria-label="Weather city results">
      {resource.data?.map(location => <li key={location.id}>
        <button type="button" onClick={() => onSelect(location)}>{weatherLocationLabel(location)}</button>
      </li>)}
    </ul>
  </ResourceState>;
}

export function WeatherSearch({ onSelect }: { onSelect(location: WeatherLocation): void }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState<{ query: string; run: number }>();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = input.trim();
    if (query.length >= 2) setSearch(previous => ({ query, run: (previous?.run ?? 0) + 1 }));
  };
  return <>
    <form onSubmit={submit} className="flex items-end flex-wrap gap-3">
      <label className="flex flex-col gap-1">City in the Philippines
        <input value={input} onChange={event => setInput(event.target.value)} minLength={2} maxLength={100} required placeholder="e.g. Manila" />
      </label>
      <button type="submit" disabled={input.trim().length < 2}>Search weather cities</button>
    </form>
    {search && search.query === input.trim() && <SearchResults key={search.run} query={search.query} onSelect={location => {
      onSelect(location); setSearch(undefined);
    }} />}
  </>;
}
