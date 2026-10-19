import type { StaffIncident, User, Zone } from '@aqours/contracts';
import type { Field } from './ActionForm';
import { categoryOptions, ownerOptions, zoneOptions } from './Filters';

export function incidentFields(users: User[] = [], zones: Zone[] = [], d?: StaffIncident): Field[] {
  return [
    ...(!d ? [{ name: 'category', label: 'Category', type: 'select' as const, required: true, options: categoryOptions }] : []),
    { name: 'summary', label: 'Incident summary', value: d?.summary, required: true },
    { name: 'zoneIds', label: 'Explicit affected zones', type: 'multi', options: zoneOptions(zones), value: d?.zoneIds, required: true, hint: 'Select the reviewed service zones; proximity alone does not establish an association.' },
    { name: 'area', label: 'Affected area description', type: 'textarea', value: d?.area, required: true },
    { name: 'ownerId', label: 'Owner', type: 'select', value: d?.ownerId, options: ownerOptions(users), nullable: true },
    { name: 'restorationAt', label: 'Restoration estimate (Manila)', type: 'datetime-local', value: d?.restorationAt, nullable: true, hint: 'Leave blank when unknown.' },
    { name: 'estimatedAffected', label: 'Estimated affected customers', type: 'number', min: 0, step: '1', value: d?.estimatedAffected, nullable: true },
    { name: 'estimateBasis', label: 'Estimate basis / source', type: 'textarea', value: d?.estimateBasis, nullable: true },
    { name: 'geometry', label: 'Optional approved area geometry', type: 'json', value: d?.geometry ? JSON.stringify(d.geometry) : '', nullable: true, hint: 'GeoJSON Polygon or MultiPolygon. Exclude household coordinates.' },
    ...(!d ? [{ name: 'demo', label: 'Fictional demonstration incident', type: 'checkbox' as const }] : []),
  ];
}
