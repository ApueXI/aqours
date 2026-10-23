import { useId, type ReactNode } from 'react';

/** Keep comparable operational fields in columns at every screen size. */
export function OperationsTable({ label, children }: { label: string; children: ReactNode }) {
  const hint = useId();
  return <>
    <p id={hint} className="operations-scroll-hint">Scroll across the table for all columns.</p>
    <div className="operations-table" tabIndex={0} role="region" aria-label={label} aria-describedby={hint}>
      {children}
    </div>
  </>;
}
