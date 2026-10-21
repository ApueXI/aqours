import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { PsgcPart, PsgcPlace, StructuredAddressInput } from '@aqours/contracts';
import { useSession } from '@/features/auth/hooks/session';
import { Body, Button, ErrorNotice, Field, styles } from '@/components/ui';
import { errorText } from '@/services/http-client';

export function PsgcAddressPicker({ disabled, onChange }: {
  disabled: boolean; onChange(address: string, input: StructuredAddressInput | null, ready: boolean): void;
}) {
  const { api } = useSession();
  const [parts, setParts] = useState<PsgcPart[]>([]);
  const [street, setStreet] = useState('');
  const [search, setSearch] = useState('');
  const [places, setPlaces] = useState<PsgcPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const parent = parts.at(-1);
  const code = parent?.code;
  const complete = parent?.level === 'barangay';
  useEffect(() => {
    let active = true;
    if (complete) return;
    // Reset the external request state before loading a new parent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null); setPlaces([]);
    void api<PsgcPlace[]>(code ? `/locations/psgc/children?parentCode=${code}` : '/locations/psgc/regions').then(response => {
      if (active) setPlaces(response.data);
    }).catch(failure => { if (active) setError(errorText(failure)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, code, complete, retry]);
  function update(next: PsgcPart[], details: string) {
    setParts(next); setStreet(details); setSearch('');
    const ready = next.at(-1)?.level === 'barangay';
    const address = [details.trim(), ...[...next].reverse().map(part => part.name), 'Philippines'].filter(Boolean).join(', ');
    onChange(address, ready ? { barangayCode: next.at(-1)!.code, streetDetails: details } : null, ready);
  }
  const matches = places.filter(place => place.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <View style={{ gap: 8 }}>
    <Body muted>Choose an address using PSGC Q2 2026.</Body>
    {parts.map((part, index) => <Button key={part.code} title={`Change ${part.name}`} secondary disabled={disabled}
      onPress={() => update(parts.slice(0, index), street)} />)}
    {!complete && <>
      <Field label={parent ? `Search within ${parent.name}` : 'Search region'} value={search} onChangeText={setSearch} editable={!disabled} />
      {loading && <Body muted>Loading places…</Body>}
      <ErrorNotice error={error} />{error && <Button title="Retry address list" secondary disabled={disabled} onPress={() => setRetry(value => value + 1)} />}
      <View style={styles.section}>{matches.slice(0, 30).map(place => <Button key={place.code} secondary disabled={disabled || loading}
        title={`${place.name} · ${place.level === 'sub_municipality' ? 'district' : place.level}`}
        onPress={() => update([...parts, place], street)} />)}</View>
      {!loading && !error && !matches.length && <Body muted>No places match your search. You can use a free-text address.</Body>}
      {matches.length > 30 && <Body muted>Showing 30 of {matches.length} places. Type to narrow the list.</Body>}
    </>}
    <Field label="Street, building, or landmark" value={street} maxLength={1000} onChangeText={value => update(parts, value)} editable={!disabled} />
  </View>;
}
