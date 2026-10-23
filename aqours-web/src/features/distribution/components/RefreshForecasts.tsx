import { useState } from 'react';
import type { MonitoredSite } from '@aqours/contracts';
import { createIntent, errorText, RequestError, sendIntent, type Intent } from '../../../services/http-client';

export function RefreshForecasts({ items, refresh }: { items: MonitoredSite[]; refresh: () => void }) {
  const [pending, setPending] = useState(false), [failed, setFailed] = useState<Intent[]>([]);
  const [error, setError] = useState<unknown>(), [done, setDone] = useState(false);
  const run = async (actions: Intent[]) => {
    setPending(true); setError(undefined); setDone(false); const retry: Intent[] = [], problems: unknown[] = [];
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(3, actions.length) }, async () => {
      while (cursor < actions.length) {
        const action = actions[cursor++];
        try { await sendIntent(action); }
        catch (problem) { problems.push(problem); if (!(problem instanceof RequestError) || problem.status < 400 || problem.status >= 500) retry.push(action); }
      }
    }));
    setFailed(retry); setError(problems[0]); setDone(problems.length === 0); setPending(false); refresh();
  };
  return <div className="forecast-refresh"><button type="button" disabled={pending || failed.length > 0} onClick={() => {
    refresh(); void run(items.filter(item => item.site.active && item.site.latitude !== null && item.site.longitude !== null)
      .map(item => createIntent(`/staff/pickup-sites/${item.site.id}/forecast/refresh`, 'POST', {})));
  }}>Refresh monitoring</button>
    {pending && <span role="status">Requesting forecast refresh…</span>}{done && <span role="status">Monitoring refreshed; forecast refresh requests respect the server cooldown.</span>}
    {Boolean(error) && <p role="alert" className="error">{errorText(error)}</p>}
    {failed.length > 0 && !pending && <button type="button" onClick={() => void run(failed)}>Retry original refresh actions</button>}
  </div>;
}
