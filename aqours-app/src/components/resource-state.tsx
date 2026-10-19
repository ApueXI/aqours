import { Body, Button, ErrorNotice, Loading } from './ui';

export function ResourceState({ loading, error, empty, reload }: {
  loading: boolean; error: string | null; empty?: string | false; reload(): Promise<void>;
}) {
  return <>
    {loading && <Loading />}
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
