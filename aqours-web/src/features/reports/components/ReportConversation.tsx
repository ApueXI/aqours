import { useEffect, useMemo, useRef } from 'react';
import type { Message } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { date, label } from '../../../components/Status';

const day = (value: string) => new Date(value).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });

export function ReportConversation({ id, messages, visible, refresh }: { id: string; messages: Message[]; visible: boolean; refresh(): void }) {
  const ordered = useMemo(() => [...messages].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
    || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)), [messages]);
  const feed = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const ownSend = useRef(false);
  const shown = useRef(false);
  useEffect(() => {
    if (!visible) return;
    if (feed.current && (nearBottom.current || ownSend.current)) feed.current.scrollTop = feed.current.scrollHeight;
    ownSend.current = false;
    shown.current = true;
  }, [ordered, visible]);
  return <section id="report-conversation" className="report-conversation" tabIndex={-1}>
    <h2>Customer conversation</h2><p className="hint">Visible to the customer. Record private operational details in Internal notes.</p>
    <div className="message-feed" ref={feed} role="region" aria-label="Customer messages" tabIndex={0} onScroll={() => {
      const node = feed.current;
      if (node && visible && shown.current) nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
    }}>
      {ordered.length === 0 && <p className="empty-conversation">No messages yet. Acknowledge the report or ask the customer for details.</p>}
      {ordered.map((message, index) => <div key={message.id}>
        {(index === 0 || day(ordered[index - 1].createdAt) !== day(message.createdAt)) && <p className="message-date">{day(message.createdAt)}</p>}
        <article className="message-bubble" data-direction={message.authorRole === 'customer' ? 'incoming' : 'outgoing'}>
          <strong>{message.authorRole === 'customer' ? 'Customer' : `Supplier · ${label(message.authorRole)}`}</strong>
          <p className="preserve">{message.text}</p><time dateTime={message.createdAt}>{date(message.createdAt)}</time>
        </article>
      </div>)}
    </div>
    <div className="message-composer"><ActionForm path={`/staff/reports/${id}/messages`} submit="Send to customer" resetOnSuccess
      onDone={() => { ownSend.current = true; refresh(); }}
      fields={[{ name: 'text', label: 'Customer-visible message', type: 'textarea', required: true, hint: 'Your first customer-visible message records the first staff response.' }]} /></div>
  </section>;
}
