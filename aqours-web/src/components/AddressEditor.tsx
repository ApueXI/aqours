import { useState } from 'react';
import type { AddressSnapshot, PsgcPlace, PsgcPart } from '@aqours/contracts';
import { useResource } from '../hooks/useResource';
import { ResourceState } from './Status';

const levelLabel = (level: string) => level === 'sub_municipality' ? 'District' : level.replaceAll('_', ' ');
function AddressLevel({ parent, selected, onSelect }: { parent?: PsgcPart; selected?: PsgcPart; onSelect: (place: PsgcPlace | undefined) => void }) {
  const resource = useResource<PsgcPlace[]>(parent ? `/locations/psgc/children?parentCode=${parent.code}` : '/locations/psgc/regions');
  const [search, setSearch] = useState('');
  const title = parent ? `Place within ${parent.name}` : 'Region';
  // Retain the selected option while searching so the browser never submits an invisible replacement.
  const places = (resource.data || []).filter(place => place.code === selected?.code || place.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <div>
    <label className="field"><span>Search {title.toLowerCase()}</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <label className="field"><span>{title} *</span><select aria-label={title} required value={selected?.code || ''} disabled={!resource.data}
      onChange={event => onSelect(resource.data?.find(place => place.code === event.target.value))}>
      <option value="">Select…</option>{places.map(place => <option key={place.code} value={place.code}>{place.name} · {levelLabel(place.level)}</option>)}
    </select></label>
    <ResourceState resource={resource} />
  </div>;
}
export function AddressEditor({ name, label, value, snapshot }: { name: string; label: string; value?: string; snapshot?: AddressSnapshot | null }) {
  const [guided, setGuided] = useState(false);
  const [parts, setParts] = useState<PsgcPart[]>(snapshot?.ancestry || []);
  const [streetDetails, setStreetDetails] = useState(snapshot?.streetDetails || '');
  const [text, setText] = useState(value || '');
  const complete = parts.at(-1)?.level === 'barangay';
  const formatted = [streetDetails.trim(), ...[...parts].reverse().map(part => part.name), 'Philippines'].filter(Boolean).join(', ');
  return <fieldset className="address-editor">
    <legend>{label}</legend>
    <div className="address-modes" role="group" aria-label="Address entry method">
      <button type="button" aria-pressed={!guided} onClick={() => { if (guided && complete) setText(formatted); setGuided(false); }}>Free-text address</button>
      <button type="button" aria-pressed={guided} onClick={() => setGuided(true)}>Choose Philippine address</button>
    </div>
    {guided ? <>
      {Array.from({ length: parts.length + (complete ? 0 : 1) }, (_, index) => <AddressLevel key={parts[index - 1]?.code || 'regions'}
        parent={parts[index - 1]} selected={parts[index]} onSelect={place => setParts([...parts.slice(0, index), ...(place ? [place] : [])])} />)}
      <label className="field"><span>Street, building, or landmark</span><input maxLength={1000} value={streetDetails} onChange={event => setStreetDetails(event.target.value)} /></label>
      <p className="address-preview">{formatted}</p><input type="hidden" name={name} value={formatted} />
    </> : <label className="field"><span>Full address *</span><textarea aria-label={label} name={name} required maxLength={5000} value={text} onChange={event => setText(event.target.value)} /></label>}
    <input type="hidden" name={`${name}:guided`} value={String(guided)} />
    <input type="hidden" name={`${name}:structured`} value={JSON.stringify(guided && complete ? { barangayCode: parts.at(-1)!.code, streetDetails } : (!guided && snapshot && text === value ? { barangayCode: snapshot.barangayCode, streetDetails: snapshot.streetDetails } : null))} />
    <p className="hint">PSGC Q2 2026 supplies administrative names. Coordinates and service zones require separate confirmation.</p>
  </fieldset>;
}
