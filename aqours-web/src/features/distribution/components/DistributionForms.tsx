import type { PickupSession, PickupSite, Zone } from '@aqours/contracts';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { options, zoneOptions } from '../../../components/Filters';
import { date } from '../../../components/Status';

export function SiteForm({ d, refresh }: { d?: PickupSite; refresh: () => void }) {
  const fields: Field[] = [
    { name: 'name', label: 'Pickup site name', value: d?.name, required: true },
    { name: 'address', label: 'Full address', type: 'address', value: d?.address, snapshot: d?.structuredAddress, required: true },
    { name: 'instructions', label: 'Site instructions', type: 'textarea', value: d?.instructions, required: true },
    { name: 'latitude', label: 'Latitude (optional)', type: 'number', min: -90, max: 90, step: 'any', value: d?.latitude, nullable: true },
    { name: 'longitude', label: 'Longitude (optional)', type: 'number', min: -180, max: 180, step: 'any', value: d?.longitude, nullable: true },
    { name: 'active', label: 'Active pickup site', type: 'checkbox', value: d?.active ?? true },
    ...(d ? [{ name: 'reason', label: 'Change reason', type: 'textarea' as const, required: true }] : [{ name: 'demo', label: 'Fictional demonstration site', type: 'checkbox' as const }]),
  ];
  return <ActionForm path={d ? `/staff/pickup-sites/${d.id}` : '/staff/pickup-sites'} method={d ? 'PATCH' : 'POST'} version={d?.version}
    fields={fields} submit={d ? 'Save pickup site' : 'Create pickup site'} onDone={refresh} />;
}
export function SessionForm({ d, sites, zones, refresh }: { d?: PickupSession; sites: PickupSite[]; zones: Zone[]; refresh: () => void }) {
  const fields: Field[] = [
    ...(!d ? [{ name: 'siteId', label: 'Pickup site', type: 'select' as const, required: true, options: sites.filter(site => site.active).map(site => ({ value: site.id, label: `${site.name} · ${site.address}` })) }] : []),
    { name: 'zoneIds', label: 'Eligible service zones', type: 'multi', required: true, value: d?.zoneIds, options: zoneOptions(zones) },
    { name: 'startsAt', label: 'Opens (Manila)', type: 'datetime-local', required: true, value: d?.startsAt },
    { name: 'endsAt', label: 'Closes (Manila)', type: 'datetime-local', required: true, value: d?.endsAt },
    { name: 'totalLiters', label: 'Total stock (liters)', required: true, value: d?.totalLiters, hint: 'Exact decimal quantity, at most two decimal places. Current reservations and collected liters are retained.' },
    { name: 'instructions', label: 'Customer pickup instructions', type: 'textarea', required: true, value: d?.instructions },
    ...(d ? [
      { name: 'status', label: 'Session status', type: 'select' as const, value: d.status, required: true, options: options(['open', 'closed']) },
      { name: 'reason', label: 'Stock / schedule change reason', type: 'textarea' as const, required: true },
    ] : [{ name: 'demo', label: 'Fictional demonstration session', type: 'checkbox' as const }]),
  ];
  return <ActionForm path={d ? `/staff/distribution/sessions/${d.id}` : '/staff/distribution/sessions'} method={d ? 'PATCH' : 'POST'}
    version={d?.version} fields={fields} submit={d ? 'Save pickup session' : 'Create pickup session'} onDone={refresh} />;
}
export function CancelSession({ d, refresh }: { d: PickupSession; refresh: () => void }) {
  return <ActionForm path={`/staff/distribution/sessions/${d.id}/cancel`} version={d.version} submit="Cancel pickup session" onDone={refresh}
    fields={[{ name: 'reason', label: 'Cancellation reason / customer follow-up', type: 'textarea', required: true }]}
    preview={body => <><h3>Cancel {d.site.name} · {date(d.startsAt)}</h3><p>{String(body.reason)}</p>
      <p>All pending and uncollected water requests become unavailable and their reservations are released. Collected outcomes remain recorded.</p>
      <p>{d.reservedLiters} L currently reserved · {d.collectedLiters} L already collected</p></>} />;
}
