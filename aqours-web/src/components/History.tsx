import type { Note, TimelineEvent } from '@aqours/contracts';
import { date, label } from './Status';
import { ActionForm } from './ActionForm';

export function History({ events = [] }: { events?: TimelineEvent[] }) {
  return <section><h2>History</h2>{events.length === 0 ? <p>No history yet.</p> : <ol className="history m-[0] pl-[20px] [&_li]:[padding:8px_0] [&_p]:[margin:6px_0]">
    {events.map(event => <li key={event.id}><div><strong>{label(event.action)}</strong> · {date(event.createdAt)}</div>
      <p>{event.text}</p>{event.fromStatus && <p>{label(event.fromStatus)} → {label(event.toStatus || '')}</p>}
      {event.appointmentChange && <p>{event.appointmentChange.from
        ? `Agreed appointment changed from ${date(event.appointmentChange.from)} to ${date(event.appointmentChange.to)}`
        : `Agreed appointment: ${date(event.appointmentChange.to)}`}</p>}
    </li>)}
  </ol>}</section>;
}
export function Notes({ path, notes = [], refresh }: { path: string; notes?: Note[]; refresh: () => void }) {
  return <section><h2>Internal notes</h2><p className="hint text-[#475569] text-[13px]">Visible to supplier staff only.</p>
    {notes.length === 0 && <p>No internal notes.</p>}
    {notes.map(note => <article className="entry [padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]" key={note.id}><p>{note.text}</p><span>{date(note.createdAt)}</span></article>)}
    <ActionForm path={path} fields={[{ name: 'text', label: 'Internal note', type: 'textarea', required: true }]}
      submit="Add internal note" onDone={refresh} />
  </section>;
}
