import { AddressEditor } from './AddressEditor';
import type { AddressSnapshot } from '@aqours/contracts';
import { styleClasses } from '../utils/style-classes';
import { useState, type FormEvent, type ReactNode } from 'react';
import { createIntent, errorText, RequestError, sendIntent, type Intent } from '../services/http-client';

export type Option = { value: string; label: string };
export type Field = {
  name: string; label: string; type?: 'address' | 'text' | 'textarea' | 'select' | 'multi' | 'datetime-local' | 'number' | 'email' | 'password' | 'checkbox' | 'json';
  required?: boolean; value?: string | number | boolean | string[] | null; options?: Option[];
  snapshot?: AddressSnapshot | null; hint?: string; min?: number; max?: number; step?: string; nullable?: boolean; omitEmpty?: boolean;
};
export function readFields(fields: Field[], data: FormData): Record<string, unknown> {
  return Object.fromEntries(fields.flatMap(field => {
    const value = String(data.get(field.name) ?? '');
    if (field.type === 'address') {
      const structured = JSON.parse(String(data.get(`${field.name}:structured`) || 'null'));
      if (data.get(`${field.name}:guided`) === 'true' && !structured) throw new Error('Complete the PSGC address');
      return [[field.name, value], ['structuredAddress', structured]];
    }
    if (!value && field.omitEmpty) return [];
    if (field.type === 'checkbox') return [[field.name, data.has(field.name)]];
    if (field.type === 'multi') return [[field.name, data.getAll(field.name).map(String)]];
    if (!value && field.nullable) return [[field.name, null]];
    if (field.type === 'number') return [[field.name, value ? Number(value) : null]];
    if (field.type === 'json') return [[field.name, value ? JSON.parse(value) : null]];
    if (field.type === 'datetime-local') return [[field.name, value ? new Date(`${value}:00+08:00`).toISOString() : null]];
    return [[field.name, value]];
  }));
}
function localTime(value: Field['value']) {
  if (!value || typeof value !== 'string') return '';
  return new Date(new Date(value).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16);
}
export function Fields({ fields }: { fields: Field[] }) {
  return <>{fields.map(field => {
    if (field.type === 'address') return <AddressEditor key={field.name} name={field.name} label={field.label} value={String(field.value || '')} snapshot={field.snapshot} />;
    const id = field.name;
    const base = { name: id, required: field.required, 'aria-label': field.label };
    let control: ReactNode;
    if (field.type === 'textarea' || field.type === 'json') {
      control = <textarea {...base} rows={field.type === 'json' ? 4 : 3} defaultValue={String(field.value ?? '')} />;
    } else if (field.type === 'select' || field.type === 'multi') {
      control = <select {...base} multiple={field.type === 'multi'} defaultValue={field.value as string | string[] | undefined ?? (field.type === 'multi' ? [] : '')}>
        {field.type !== 'multi' && <option value="">{field.required ? 'Select…' : 'None / unknown'}</option>}
        {field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>;
    } else if (field.type === 'checkbox') {
      control = <input {...base} type="checkbox" defaultChecked={Boolean(field.value)} />;
    } else {
      control = <input {...base} type={field.type || 'text'} min={field.min} max={field.max} step={field.step}
        autoComplete={field.type === 'password' ? 'new-password' : undefined}
        defaultValue={field.type === 'datetime-local' ? localTime(field.value) : String(field.value ?? '')} />;
    }
    return <label className={styleClasses(field.type === 'checkbox' ? 'check-field' : 'field')} key={id}>
      <span>{field.label}{field.required ? ' *' : ''}</span>{control}{field.hint && <span className="hint text-[#475569] text-[13px]">{field.hint}</span>}
    </label>;
  })}</>;
}
type Props = {
  path: string; method?: 'POST' | 'PATCH'; fields: Field[]; submit: string; version?: number;
  extra?: Record<string, unknown>; onDone: () => void; children?: ReactNode;
  preview?: (body: Record<string, unknown>) => ReactNode;
};
export function ActionForm({ path, method = 'POST', fields, submit, version, extra, onDone, children, preview }: Props) {
  const [intent, setIntent] = useState<Intent>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>();
  const send = async (action: Intent) => {
    setPending(true); setError(undefined); setSaved(false);
    try {
      await sendIntent(action);
      setIntent(undefined); setDraft(undefined); setSaved(true); onDone();
    } catch (problem) {
      setError(problem);
      // Keep the exact key and body after uncertain transport/server failure.
      if (problem instanceof RequestError && problem.status >= 400 && problem.status < 500) setIntent(undefined);
    } finally { setPending(false); }
  };
  const start = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(undefined); setSaved(false);
    try {
      const body = { ...readFields(fields, new FormData(event.currentTarget)), ...extra,
        ...(version === undefined ? {} : { expectedVersion: version }) };
      if (preview) { setDraft(body); return; }
      const next = createIntent(path, method, body); setIntent(next); void send(next);
    } catch { setError(new RequestError(400, 'validation', 'Check the form. Complete guided addresses, use valid geometry JSON, and enter valid Manila times.')); }
  };
  return <form className="action-form mt-[16px] max-w-[720px] [&_fieldset_>_button]:mt-[4px]" onSubmit={start}>
    <fieldset disabled={pending || Boolean(intent) || Boolean(draft)}><Fields fields={fields} />{children}
      <button className="primary" type="submit">{submit}</button>
    </fieldset>
    {draft && <section className="preview p-[16px] mt-[20px] [border:1px_solid_#0f766e] bg-[#f8fafc]" aria-label="Publication preview">{preview?.(draft)}
      <div className="actions flex flex-wrap gap-[8px] mt-[20px]"><button type="button" disabled={pending || Boolean(intent)} onClick={() => setDraft(undefined)}>Back to edit</button>
        <button className="primary" type="button" disabled={pending || Boolean(intent)} onClick={() => {
          const next = createIntent(path, method, draft); setIntent(next); void send(next);
        }}>Confirm {submit.toLowerCase()}</button></div>
    </section>}
    {pending && <p role="status">Saving…</p>}
    {Boolean(error) && <p className="error [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#9f1239] bg-[#fff1f2] [border-color:#be123c]" role="alert">{errorText(error)}</p>}
    {intent && !pending && <button type="button" onClick={() => void send(intent)}>Retry original action</button>}
    {saved && <p className="success [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#115e59] bg-[#f0fdfa] [border-color:#0f766e]" role="status">Saved. Current records are refreshing.</p>}
  </form>;
}
