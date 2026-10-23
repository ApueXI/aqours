import { useEffect, useState } from 'react';
import type { User } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { options } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { label, ResourceState } from '../../../components/Status';

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
  const [selected, setSelected] = useState<string>();
  const [search, setSearch] = useState('');
  useEffect(() => { if (selected) document.getElementById('account-editor')?.focus(); }, [selected]);
  const resource = useResource<User[]>(`/staff/settings/accounts?offset=${offset}`);
  const account = resource.data?.find(item => item.id === selected);
  const refresh = () => void resource.refresh();
  const matches = (item: NonNullable<typeof resource.data>[number]) => `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(search.trim().toLowerCase());
  return <><h2>Accounts</h2><p className="hint">Role, password, and activation changes revoke this account’s existing sessions. Account history and owned records are preserved.</p>
    <button onClick={refresh}>Refresh accounts</button><label className="field settings-search"><span>Find accounts on this page</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <ResourceState resource={resource}>{resource.data && <>
      <div className="table-scroll responsive-table"><table className="account-directory-table"><thead><tr><th>Account</th><th>Email</th><th>Role</th><th>State</th><th>Action</th></tr></thead><tbody>
        {resource.data.filter(matches).map(user => <tr key={user.id}><td>{user.name}</td><td data-label="Email">{user.email}</td><td data-label="Role">{label(user.role)}</td><td data-label="State">{user.active ? 'Active' : 'Inactive'}</td>
          <td><button onClick={() => setSelected(user.id)}>Edit {user.name}</button></td></tr>)}
      </tbody></table></div>{resource.data.filter(matches).length === 0 && <p>No accounts.</p>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={value => { setOffset(value); setSelected(undefined); }} />
    </>}</ResourceState>
    {account && <section id="account-editor" className="settings-editor" tabIndex={-1} key={`${account.id}:${account.version}`}><h3>Edit {account.name}</h3><button type="button" onClick={() => setSelected(undefined)}>Close editor</button><AccountForm d={account} refresh={refresh} /></section>}
    <details><summary>Create account</summary><AccountForm refresh={refresh} /></details>
  </>;
}
