import { useState } from 'react';
import type { User, Zone } from '@aqours/contracts';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { options, zoneOptions } from '../../../components/Filters';
import { provisionAccountBody } from '../utils/provision-account';

export function AccountForm({ account, zones, refresh }: { account?: User; zones: Zone[]; refresh(): void }) {
  const [role, setRole] = useState(account?.role || 'customer');
  const fields: Field[] = [
    ...(!account ? [{ name: 'email', label: 'Account email', type: 'email' as const, required: true }] : []),
    { name: 'name', label: 'Name', value: account?.name, required: true },
    { name: 'phone', label: 'Phone', value: account?.phone, nullable: true },
    { name: 'role', label: 'Role', type: 'select', value: role, options: options(['customer', 'staff', 'admin']), required: true },
    { name: 'password', label: account ? 'New password (leave blank to retain)' : 'Initial password', type: 'password', required: !account, omitEmpty: Boolean(account), hint: 'At least 12 characters. Customers can change this in Profile after signing in.' },
    ...(account ? [
      { name: 'active', label: 'Account active', type: 'checkbox' as const, value: account.active },
      { name: 'reason', label: 'Change reason', type: 'textarea' as const, required: true },
    ] : role === 'customer' ? [
      { name: 'address', label: 'Service address', type: 'address' as const, required: true },
      { name: 'zoneId', label: 'Service zone', type: 'select' as const, options: zoneOptions(zones.filter(zone => zone.active)), nullable: true },
      { name: 'zoneConfirmed', label: 'I have verified that this zone supplies this connection', type: 'checkbox' as const },
    ] : []),
  ];
  return <div onChange={event => {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.name === 'role') setRole(target.value as User['role']);
  }}><ActionForm path={account ? `/staff/settings/accounts/${account.id}` : '/staff/settings/accounts'}
    method={account ? 'PATCH' : 'POST'} version={account?.version} fields={fields}
    transform={account ? undefined : provisionAccountBody}
    validate={body => {
      const connection = body.connection as Record<string, unknown> | undefined;
      return connection?.zoneConfirmed && !connection.zoneId ? 'Choose a service zone before confirming it.' : undefined;
    }} submit={account ? 'Save account' : role === 'customer' ? 'Create account and connection' : 'Create account'} onDone={refresh} />
  </div>;
}
