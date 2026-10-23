import type { FormEvent } from 'react';
import { categories, type User, type Zone } from '@aqours/contracts';
import { Fields, type Field, type Option } from './ActionForm';
import { label } from './Status';

export const options = (values: readonly string[]): Option[] => values.map(value => ({ value, label: label(value) }));
export const categoryOptions = options(categories);
export const reportStatuses = ['received', 'under_review', 'in_progress', 'resolved'];
export const incidentStatuses = ['investigating', 'confirmed', 'work_in_progress', 'monitoring', 'resolved'];
export const assistanceStatuses = ['requested', 'accepted', 'scheduled', 'in_progress', 'completed', 'unavailable', 'cancelled'];
export const assistanceTypes = ['callback', 'inspection', 'water_support'];
export const advisoryKinds = ['scheduled_interruption', 'boil_water', 'do_not_drink', 'do_not_use', 'general'];
export const ownerOptions = (users: User[] = []) => users.map(user => ({ value: user.id, label: `${user.name} (${label(user.role)})` }));
export const zoneOptions = (zones: Zone[] = []) => zones.map(zone => ({ value: zone.id, label: `${zone.code} · ${zone.name}${zone.active ? '' : ' (inactive)'}` }));
export function FilterBar({ values, onChange, statuses = reportStatuses, zones, owners, assistance = false, priority = false, hideStatus = false }: {
  values: Record<string, string>; onChange: (values: Record<string, string>) => void;
  statuses?: string[]; zones?: Zone[]; owners?: User[]; assistance?: boolean; priority?: boolean; hideStatus?: boolean;
}) {
  const fields: Field[] = [
    { name: assistance ? 'type' : 'category', label: assistance ? 'Service type' : 'Category', type: 'select', options: assistance ? options(assistanceTypes) : categoryOptions },
    ...(!hideStatus ? [{ name: 'status', label: 'Status', type: 'select' as const, options: options(statuses) }] : []),
    { name: 'from', label: 'Submitted from (Manila)', type: 'datetime-local' },
    { name: 'to', label: 'Submitted before (Manila)', type: 'datetime-local' },
    ...(zones ? [{ name: 'zoneId', label: 'Zone', type: 'select' as const, options: zoneOptions(zones) }] : []),
    ...(owners ? [{ name: 'ownerId', label: 'Owner', type: 'select' as const, options: ownerOptions(owners) }] : []),
    ...(priority ? [{ name: 'priority', label: 'Priority', type: 'select' as const, options: options(['normal', 'high', 'urgent']) }] : []),
  ];
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = Object.fromEntries(fields.map(field => {
      const value = String(data.get(field.name) || '');
      return [field.name, field.type === 'datetime-local' && value ? new Date(`${value}:00+08:00`).toISOString() : value];
    }));
    onChange(next);
  };
  const prepared = fields.map(field => ({ ...field, value: values[field.name], placeholder: 'All' }));
  const primary = prepared.filter(field => ['category', 'type', 'status'].includes(field.name));
  const advanced = prepared.filter(field => !['category', 'type', 'status'].includes(field.name));
  const active = advanced.filter(field => values[field.name]).length;
  return <form key={JSON.stringify(values)} className="filters" aria-label="Filter records" onSubmit={apply}>
    <Fields fields={primary} />
    <details className="filter-more"><summary>More filters{active ? ` · ${active} active` : ''}</summary><div className="filter-fields"><Fields fields={advanced} /></div></details>
    <div className="filter-actions"><button type="submit">Apply filters</button>
      {Object.values(values).some(Boolean) && <button type="button" onClick={() => onChange({})}>Clear filters</button>}
    </div>
  </form>;
}
