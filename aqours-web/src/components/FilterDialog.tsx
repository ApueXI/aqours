import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { FiSliders, FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import { Fields, type Field } from './ActionForm';

export function FilterDialog({ fields, values, onChange }: {
  fields: Field[]; values: Record<string, string>; onChange: (values: Record<string, string>) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const [open, setOpen] = useState(false);
  const count = fields.filter(field => values[field.name]).length;
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  const close = () => { dialog.current?.close(); setOpen(false); trigger.current?.focus(); };
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = Object.fromEntries(fields.map(field => {
      const value = String(data.get(field.name) || '');
      return [field.name, field.type === 'datetime-local' && value ? new Date(`${value}:00+08:00`).toISOString() : value];
    }));
    onChange(next); close();
  };
  return <div className="filter-toolbar">
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><FiSliders aria-hidden="true" />Filters{count > 0 && <span className="filter-count">{count}</span>}</button>
    <span className="filter-scope">{count ? `${count} active ${count === 1 ? 'filter' : 'filters'}` : 'No filters applied'}</span>
    {count > 0 && <button type="button" className="text-button" onClick={() => onChange({})}><FiX aria-hidden="true" />Clear filters</button>}
    {createPortal(<dialog ref={dialog} className="form-dialog filter-dialog" aria-labelledby={heading} onCancel={event => { event.preventDefault(); close(); }}>
      <header className="form-dialog-header"><h2 id={heading}>Filter records</h2><button type="button" aria-label="Close filters" onClick={close}><FiX aria-hidden="true" />Close</button></header>
      {open && <form key={JSON.stringify(values)} onSubmit={apply} aria-label="Filter records">
        <div className="filter-dialog-fields"><Fields fields={fields.map(field => ({ ...field, value: values[field.name], placeholder: 'All' }))} /></div>
        <footer className="filter-dialog-footer"><button type="button" onClick={event => {
          const form = event.currentTarget.form;
          form?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(control => { control.value = ''; });
        }}>Clear all</button><button type="submit" className="primary">Apply filters</button></footer>
      </form>}
    </dialog>, document.body)}
  </div>;
}
