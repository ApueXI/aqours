export function Pagination({ offset, total, limit = 30, onChange }: {
  offset: number; total: number; limit?: number; onChange: (offset: number) => void;
}) {
  return <nav className="pagination" aria-label="Pagination">
    <span>{total === 0 ? 'No records' : `${offset + 1}–${Math.min(offset + limit, total)} of ${total}`}</span>
    <button type="button" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>Previous</button>
    <button type="button" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>Next</button>
  </nav>;
}
