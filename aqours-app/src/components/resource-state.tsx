import { Body, Button, ErrorNotice, Loading } from './ui';
import { displayTime } from '@/lib/time';

export function ResourceState({ loading, error, empty, stale, receivedAt, reload }: {
  loading: boolean; error: string | null; empty?: string | false; stale?: boolean; receivedAt?: string | null; reload(): Promise<void>;
}) {
  return <>
    {loading && <Loading />}
    {stale && <Body muted>{loading ? 'Refreshing. The information below was loaded earlier.' : 'The information below was loaded earlier and could not be refreshed.'}
      {receivedAt ? ` Last loaded ${displayTime(receivedAt)} on this device.` : ''}</Body>}
    <ErrorNotice error={error} retry={() => void reload()} />
    {!loading && !error && empty && <Body muted>{empty}</Body>}
  </>;
}

export function Paging({ offset, total, onChange }: { offset: number; total?: number; onChange(offset: number): void }) {
  return <>
    {offset > 0 && <Button title="Previous page" secondary onPress={() => onChange(Math.max(0, offset - 30))} />}
    {total !== undefined && offset + 30 < total && <Button title="Next page" secondary onPress={() => onChange(offset + 30)} />}
  </>;
}
