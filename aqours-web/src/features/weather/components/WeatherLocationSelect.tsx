import { useState } from 'react';

type Option = { code: string; name: string };
export function WeatherLocationSelect({ label, searchLabel, options, value, onChange, disabled, placeholder }: {
  label: string; searchLabel: string; options: Option[]; value: string;
  onChange: (code: string) => void; disabled?: boolean; placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const filtered = options.filter(option => option.code === value || option.name.toLocaleLowerCase().includes(query));
  return <div className="weather-location-level">
    <label className="field"><span>{searchLabel}</span>
      <input type="search" value={search} disabled={disabled} onChange={event => setSearch(event.target.value)} />
    </label>
    <label className="field"><span>{label}</span>
      <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {filtered.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
      </select>
    </label>
    {!disabled && options.length > 0 && filtered.length === 0 && <p role="status">No matching options. Try another name.</p>}
  </div>;
}
