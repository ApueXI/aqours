import type { Note, TimelineEvent } from '@aqours/contracts';
import { date, label } from './Status';
import { ActionForm } from './ActionForm';

export function History({ events = [] }: { events?: TimelineEvent[] }) {
  return <section><h2>History</h2>{events.length === 0 ? <p>No history yet.</p> : <ol className="history">
    {events.map(event => <li key={event.id}><div><strong>{label(event.action)}</strong> · {date(event.createdAt)}</div>
      <p>{event.text}</p>{event.fromStatus && <p>{label(event.fromStatus)} → {label(event.toStatus || '')}</p>}
    </li>)}
  </ol>}</section>;
}
export function Notes({ path, notes = [], refresh }: { path: string; notes?: Note[]; refresh: () => void }) {
  return <section><h2>Internal notes</h2><p className="hint">Visible to supplier staff only.</p>
    {notes.length === 0 && <p>No internal notes.</p>}
    {notes.map(note => <article className="entry" key={note.id}><p>{note.text}</p><span>{date(note.createdAt)}</span></article>)}
    <ActionForm path={path} fields={[{ name: 'text', label: 'Internal note', type: 'textarea', required: true }]}
      submit="Add internal note" onDone={refresh} />
  </section>;
}
