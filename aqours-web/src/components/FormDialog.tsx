import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type DialogActions = { setBusy: (busy: boolean) => void; saved: () => void };
const DialogContext = createContext<DialogActions | undefined>(undefined);

export function useFormDialog() { return useContext(DialogContext); }

export function FormDialog({ title, triggerLabel, children, triggerClassName = '', defaultOpen = false, ready = true, triggerDisabled = false, onClose }: {
  title: string; triggerLabel: string; children: ReactNode; triggerClassName?: string; defaultOpen?: boolean;
  ready?: boolean; triggerDisabled?: boolean; onClose?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const autoOpened = useRef(defaultOpen && ready);
  const [open, setOpen] = useState(defaultOpen && ready);
  const [content, setContent] = useState<ReactNode>(defaultOpen && ready ? children : null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  useEffect(() => {
    if (defaultOpen && ready && !autoOpened.current) {
      autoOpened.current = true;
      setContent(children);
      setOpen(true);
    }
  }, [defaultOpen, ready, children]);

  const dismiss = (success = false) => {
    if (!success && busy) return;
    if (!success && dirty && !window.confirm('Discard your unsaved changes?')) return;
    dialog.current?.close();
    setOpen(false);
    setContent(null);
    setDirty(false);
    setBusy(false);
    onClose?.();
    if (success) setSaved(true);
  };
  const context: DialogActions = { setBusy, saved: () => dismiss(true) };

  return <>
    <button type="button" className={triggerClassName || undefined} aria-haspopup="dialog" aria-expanded={open} disabled={triggerDisabled} onClick={() => {
      setContent(children);
      setDirty(false);
      setBusy(false);
      setSaved(false);
      setOpen(true);
    }}>{triggerLabel}</button>
    {saved && <p className="success form-dialog-result" role="status">Saved. Current records are refreshing.</p>}
    {createPortal(<dialog ref={dialog} className="form-dialog" aria-labelledby={heading}
      onCancel={event => { event.preventDefault(); dismiss(); }}>
      <header className="form-dialog-header"><h2 id={heading}>{title}</h2>
        <button type="button" onClick={() => dismiss()} disabled={busy}>Close</button></header>
      <div className="form-dialog-body" onInput={() => setDirty(true)} onChange={() => setDirty(true)}>
        <DialogContext.Provider value={context}>{content}</DialogContext.Provider>
      </div>
    </dialog>, document.body)}
  </>;
}
