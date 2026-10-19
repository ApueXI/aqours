import type { ReactNode } from 'react';
import type { Resource } from '../hooks/useResource';
import { errorText } from '../services/http-client';

export function date(value?: string | null) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
export function label(value: string) { return value.replaceAll('_', ' ').replace(/^\w/, text => text.toUpperCase()); }
export function Demo({ value }: { value?: boolean }) {
  return value ? <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Demonstration data · fictional content and estimates</p> : null;
}
export function Failure({ error }: { error: unknown }) { return error ? <p className="error [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#9f1239] bg-[#fff1f2] [border-color:#be123c]" role="alert">{errorText(error)}</p> : null; }
export function ResourceState<T>({ resource, children }: { resource: Resource<T>; children?: ReactNode }) {
  return <>
    {resource.loading && <p role="status">Loading…</p>}
    <Failure error={resource.error} />
    {resource.error && resource.data !== undefined && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Stale results. Last received {date(resource.receivedAt)}. Refresh to verify current state.</p>}
    {resource.error && <button type="button" onClick={() => void resource.refresh()}>Retry loading</button>}
    {children}
  </>;
}
export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return <header className="page-title flex items-center flex-wrap gap-[16px] mb-[24px] [&_h1]:[margin:0_auto_0_0] [@media(max-width:_760px)]:gap-[12px]"><h1>{title}</h1>{children}</header>;
}
