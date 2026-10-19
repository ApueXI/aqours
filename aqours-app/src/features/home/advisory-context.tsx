import type { Advisory, Connection } from '@aqours/contracts';
import { Body } from '@/components/ui';
import { matchingConnections } from '@/lib/notice-context';
import { displayTime } from '@/lib/time';

export function AdvisoryContext({ notice, connections, verified }: {
  notice: Advisory; connections: Connection[] | null; verified: boolean;
}) {
  const matches = connections ? matchingConnections(notice, connections) : [];
  const quality = ['boil_water', 'do_not_drink', 'do_not_use'].includes(notice.kind);
  return <>
    {notice.startsAt && <Body muted>Planned start: {displayTime(notice.startsAt)}</Body>}
    {notice.endsAt && <Body muted>Planned end: {displayTime(notice.endsAt)}</Body>}
    {quality && notice.state === 'published' && notice.endsAt && <Body muted>A planned end does not lift this quality restriction.</Body>}
    {!verified ? <Body muted>Matching saved connection details are not currently verified.</Body>
      : matches.length ? matches.map(connection => <Body key={connection.id} muted>Applies to {connection.reference} · {connection.address}</Body>)
        : <Body muted>No matching saved connection is currently confirmed. Contact the supplier for affected-area details.</Body>}
  </>;
}
