import { useState, type FormEvent } from 'react';
import type { AssistanceRequest } from '@aqours/contracts';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { ResourceState, label } from '../../../components/Status';

export function ReservationLookup() {
  const [lookup, setLookup] = useState('');
  const [search, setSearch] = useState('');
  const requests = useAllRecords<AssistanceRequest>(search ? '/staff/assistance-requests?type=water_support' : null);
  const find = (event: FormEvent) => { event.preventDefault(); if (search === lookup.trim()) void requests.refresh(); setSearch(lookup.trim()); };
  const matches = requests.data?.filter(item => [item.reference, item.allocation?.reference].some(reference => reference?.toLowerCase() === search.toLowerCase()));
  return <section className="distribution-lookup"><h2>Find pickup reservation</h2>
    <form className="lookup" onSubmit={find}><label className="field"><span>Pickup or request reference</span><input value={lookup} onChange={event => setLookup(event.target.value)} required /></label><button type="submit">Find reservation</button></form>
    {search && <ResourceState resource={requests}>
      {matches?.map(item => <p key={item.id}><a href={`#/assistance/${item.id}`}>{item.reference} · {item.allocation?.reference}</a> · {label(item.status)} · {item.allocation?.liters || item.details.requestedLiters} L</p>)}
      {!requests.loading && !requests.error && matches?.length === 0 && <p>No matching pickup or request reference. <a href="#/assistance">Review the assistance queue</a> for customer follow-up.</p>}
    </ResourceState>}
  </section>;
}
