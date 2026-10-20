import type { Connection, GeocodeCandidate, LocationInput, StructuredAddressInput } from '@aqours/contracts';
import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useSession } from '@/features/auth/hooks/session';
import { Body, Button, ErrorNotice, Field, Section, styles } from '@/components/ui';
import { errorText } from '@/services/http-client';
import { PsgcAddressPicker } from './psgc-address-picker';
import { MapPreview } from './map-preview';

export function LocationPicker({ connection, value, onChange, onReadyChange, disabled }: {
  connection: Connection; value: LocationInput | null; onChange(value: LocationInput | null): void; onReadyChange(value: boolean): void; disabled: boolean;
}) {
  const { api } = useSession();
  const [address, setAddress] = useState('');
  const [guided, setGuided] = useState(false);
  const [structuredAddress, setStructuredAddress] = useState<StructuredAddressInput | null>(null);
  const [addressReady, setAddressReady] = useState(true);
  const [candidates, setCandidates] = useState<GeocodeCandidate[]>([]);
  const [pending, setPending] = useState<LocationInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  function editAddress(next: string, input: StructuredAddressInput | null = null, ready = true) {
    setStructuredAddress(input); setAddressReady(ready); setError(null);
    generation.current += 1;
    setAddress(next); setCandidates([]); setPending(null); onChange(null); onReadyChange(ready && !next.trim());
  }
  async function geocode() {
    if (!address.trim()) { setError('Enter the alternate issue address first.'); return; }
    const run = ++generation.current;
    setBusy(true); setError(null); setCandidates([]); setPending(null);
    try {
      const response = await api<GeocodeCandidate[]>('/locations/geocode', { method: 'POST', body: { address: address.trim(), structuredAddress } });
      if (run !== generation.current) return;
      setCandidates(response.data);
      if (!response.data.length) setError('No candidate found. You can report this address for supplier review.');
    } catch (failure) { if (run === generation.current) setError(errorText(failure)); }
    finally { if (run === generation.current) setBusy(false); }
  }
  async function gps() {
    const run = ++generation.current;
    setBusy(true); setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location access was denied. Use your saved address or enter an issue address.');
      const position = await Promise.race([
        // A user-requested GPS fix must also work without Google's network accuracy service.
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS is unavailable. Use your saved address or enter an issue address.')), 15000)),
      ]);
      if (run !== generation.current) return;
      setPending({ address: address.trim() || connection.address, source: 'gps', structuredAddress, latitude: position.coords.latitude,
        longitude: position.coords.longitude, accuracy: position.coords.accuracy, confirmed: false });
      setCandidates([]); onChange(null); onReadyChange(false);
    } catch (failure) { if (run === generation.current) setError(errorText(failure)); }
    finally { if (run === generation.current) setBusy(false); }
  }

  return <Section title="Issue location">
    <Body muted>Saved service address: {connection.address}</Body>
    <Button title="Use saved service address" secondary selected={!value && !pending && !address} disabled={disabled || busy}
      onPress={() => { generation.current += 1; setAddress(''); setGuided(false); setStructuredAddress(null); setAddressReady(true); setPending(null); setCandidates([]); setError(null); onChange(null); onReadyChange(true); }} />
    <View style={styles.row}>
      <Button title="Free-text address" secondary selected={!guided} disabled={disabled || busy} onPress={() => { setGuided(false); setAddressReady(true); onReadyChange(!!value || !address.trim()); }} />
      <Button title="Choose Philippine address" secondary selected={guided} disabled={disabled || busy} onPress={() => { if (!guided) { editAddress('', null, false); setGuided(true); } }} />
    </View>
    {guided ? <PsgcAddressPicker disabled={disabled || busy} onChange={editAddress} /> : <Field label="Alternate issue address (optional)" value={address} onChangeText={next => editAddress(next)} editable={!disabled && !busy} multiline />}
    {guided && <Body muted>{addressReady ? address : 'Complete the selection through barangay, or use a free-text address.'}</Body>}
    <View style={styles.row}>
      <Button title={busy ? 'Locating…' : 'Find address'} secondary disabled={disabled || busy || !addressReady} onPress={() => void geocode()} />
      <Button title="Use foreground GPS" secondary disabled={disabled || busy || !addressReady} onPress={() => void gps()} />
    </View>
    <ErrorNotice error={error} />
    {candidates.map((candidate) => <Button key={candidate.candidateToken} title={`${candidate.address}${candidate.confidence === null ? '' : ` · confidence ${candidate.confidence}`}`} secondary disabled={disabled}
      onPress={() => {
        onChange(null); onReadyChange(false);
        setPending({ address: candidate.address, structuredAddress, latitude: candidate.latitude, longitude: candidate.longitude,
          candidateToken: candidate.candidateToken, source: 'geocoded_address', confirmed: false });
      }} />)}
    {pending && <>
      <Body>{pending.address}</Body><Body muted>Source: {pending.source.replaceAll('_', ' ')} · {pending.latitude}, {pending.longitude}</Body>
      {pending.accuracy != null && <Body muted>GPS accuracy: approximately {Math.round(pending.accuracy)} meters</Body>}
      <MapPreview key={`${pending.latitude},${pending.longitude}`} latitude={pending.latitude!} longitude={pending.longitude!} />
      <Button title={value?.confirmed ? 'Location confirmed' : 'Confirm this issue location'} disabled={disabled} secondary={!!value?.confirmed}
        onPress={() => { onChange({ ...pending, confirmed: true }); onReadyChange(true); }} />
    </>}
    {addressReady && address.trim() && <Button title="Use this address without coordinates" secondary disabled={disabled || busy}
      selected={value?.address === address.trim() && value?.latitude == null}
      onPress={() => { setPending(null); setCandidates([]); onChange({ address: address.trim(), structuredAddress, source: 'geocoded_address', confirmed: false }); onReadyChange(true); }} />}
    {!address && !pending && connection.latitude !== null && connection.longitude !== null && <MapPreview latitude={connection.latitude} longitude={connection.longitude} />}
    <Body muted>{value ? value.confirmed ? 'Alternate location confirmed. The supplier will review its service zone.' : 'Address only. Location and service zone require review.' : pending || address ? 'Confirm the candidate, use an address only, or return to the saved address.' : 'Your saved service address will be used.'}</Body>
    {(pending || !!address) && !value && <Body muted>Before submitting, explicitly confirm an alternate location or return to your saved address.</Body>}
  </Section>;
}
