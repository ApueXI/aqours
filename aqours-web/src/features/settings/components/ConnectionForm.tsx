import type { Connection, User, Zone } from '@aqours/contracts';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { zoneOptions } from '../../../components/Filters';

export function ConnectionForm({ d, accounts, zones, refresh, customerId }: { d?: Connection; accounts: User[]; zones: Zone[]; refresh: () => void; customerId?: string }) {
  const fields: Field[] = [
    ...(!d ? [
      ...(!customerId ? [{ name: 'customerId', label: 'Customer', type: 'select' as const, required: true, options: accounts.filter(account => account.role === 'customer').map(account => ({ value: account.id, label: `${account.name} · ${account.email}` })) }] : []),
    ] : []),
    { name: 'address', label: 'Saved service address', type: 'address', required: true, value: d?.address, snapshot: d?.structuredAddress },
    { name: 'zoneId', label: 'Service zone', type: 'select', value: d?.zoneId, options: zoneOptions(zones), nullable: true },
    { name: 'zoneConfirmed', label: 'I have verified that this zone supplies this connection', type: 'checkbox', value: d?.zoneConfirmed },
    { name: 'latitude', label: 'Latitude (optional)', type: 'number', min: -90, max: 90, step: 'any', value: d?.latitude, nullable: true },
    { name: 'longitude', label: 'Longitude (optional)', type: 'number', min: -180, max: 180, step: 'any', value: d?.longitude, nullable: true },
    ...(d ? [{ name: 'reason', label: 'Location / association correction reason', type: 'textarea' as const, required: true }] : []),
  ];
  return <ActionForm path={d ? `/staff/settings/connections/${d.id}` : '/staff/settings/connections'} method={d ? 'PATCH' : 'POST'}
    version={d?.version} extra={customerId ? { customerId } : undefined} fields={fields} submit={d ? 'Save connection' : 'Create connection'} onDone={refresh} />;
}
