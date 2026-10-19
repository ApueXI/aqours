import type { ReactNode } from 'react';
import type { Resource } from '../hooks/useResource';
import { errorText } from '../api/client';

export function date(value?: string | null) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
export function label(value: string) { return value.replaceAll('_', ' ').replace(/^\w/, text => text.toUpperCase()); }
export function Demo({ value }: { value?: boolean }) {
  return value ? <p className="notice">Demonstration data · fictional content and estimates</p> : null;
}
export function Failure({ error }: { error: unknown }) { return error ? <p className="error" role="alert">{errorText(error)}</p> : null; }
export function ResourceState<T>({ resource, children }: { resource: Resource<T>; children?: ReactNode }) {
  return <>
    {resource.loading && <p role="status">Loading…</p>}
    <Failure error={resource.error} />
    {resource.error && resource.data !== undefined && <p className="notice">Stale results. Last received {date(resource.receivedAt)}. Refresh to verify current state.</p>}
    {resource.error && <button type="button" onClick={() => void resource.refresh()}>Retry loading</button>}
    {children}
  </>;
}
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return <header className="page-title"><h1>{title}</h1>{children}</header>;
}
