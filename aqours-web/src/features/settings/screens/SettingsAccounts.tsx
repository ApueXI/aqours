import { useState } from 'react';
import type { User } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { options } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { label, ResourceState } from '../../../components/Status';
import { FormDialog } from '../../../components/FormDialog';

function AccountForm({ d, refresh }: { d?: User; refresh: () => void }) {
  const fields: Field[] = [
    ...(!d ? [{ name: 'email', label: 'Account email', type: 'email' as const, required: true }] : []),
    { name: 'name', label: 'Name', value: d?.name, required: true },
    { name: 'phone', label: 'Phone', value: d?.phone, nullable: true },
    { name: 'role', label: 'Role', type: 'select', value: d?.role || 'customer', options: options(['customer', 'staff', 'admin']), required: true },
    { name: 'password', label: d ? 'New password (leave blank to retain)' : 'Initial password', type: 'password', required: !d, omitEmpty: Boolean(d), hint: 'At least 12 characters. Never share real credentials in demonstration data.' },
    ...(d ? [
      { name: 'active', label: 'Account active', type: 'checkbox' as const, value: d.active },
      { name: 'reason', label: 'Change reason', type: 'textarea' as const, required: true },
    ] : []),
  ];
  return <ActionForm path={d ? `/staff/settings/accounts/${d.id}` : '/staff/settings/accounts'} method={d ? 'PATCH' : 'POST'} version={d?.version}
    fields={fields} submit={d ? 'Save account' : 'Create account'} onDone={refresh} />;
}
export function SettingsAccounts() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const resource = useResource<User[]>(`/staff/settings/accounts?offset=${offset}`);
  const refresh = () => void resource.refresh();
  const matches = (item: NonNullable<typeof resource.data>[number]) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(search.trim().toLowerCase());
  return <><h2>Accounts</h2><p className="hint">Role, password, and activation changes revoke this account’s existing sessions. Account history and owned records are preserved.</p>
    <button onClick={refresh}>Refresh accounts</button><label className="field settings-search"><span>Find accounts on this page</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ResourceState resource={resource}>{resource.data && <>
      <div className="table-scroll responsive-table"><table className="account-directory-table"><thead><tr><th>Account</th><th>Email</th><th>Role</th><th>State</th><th>Action</th></tr></thead><tbody>
        {resource.data.filter(matches).map(user => <tr key={user.id}><td>{user.name}</td><td data-label="Email">{user.email}</td><td data-label="Role">{label(user.role)}</td><td data-label="State">{user.active ? 'Active' : 'Inactive'}</td>
          <td><FormDialog title={`Edit ${user.name}`} triggerLabel={`Edit ${user.name}`}>
            <AccountForm d={user} refresh={refresh} />
          </FormDialog></td></tr>)}
      </tbody></table></div>{resource.data.filter(matches).length === 0 && <p>No accounts.</p>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
    <FormDialog title="Create account" triggerLabel="Create account" triggerClassName="primary"><AccountForm refresh={refresh} /></FormDialog>
  </>;
}
