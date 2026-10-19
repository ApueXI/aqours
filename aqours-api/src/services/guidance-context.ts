import type { DB } from '../db.js';
import { digest } from '../auth.js';
import { all, get, type Doc } from '../store.js';
import { applicable, isCurrent } from './advisories.js';
import { eligibleSessions } from './stock.js';
import { published } from './reports.js';
import { project } from './projection.js';
export async function context(db: DB, report: Doc) {
  const advisory = await applicable(db, report.customerId, true);
  const rules = (await all(db, 'rule')).sort((a, b) => b.version - a.version).slice(0, 1);
  const approved = await all(db, 'approved_guidance');
  const incident = report.incidentId ? await get(db, 'incident', report.incidentId) : null;
  const incidentPublic = incident ? await published(db, incident) : null;
  const sessions = await eligibleSessions(db, report.customerId, report);
  const connections = await all(db, 'connection', report.customerId);
  const evidence = {
    engine: 'aqours-rules-1',
    report: project(report, [
      'id',
      'version',
      'category',
      'status',
      'noticedAt',
      'zoneId',
      'zoneConfirmed',
      'locationConfirmed',
      'incidentId',
      'connectionId',
    ]),
    incident: incident
      ? {
          id: incident.id,
          version: incident.version,
          publicationId: incidentPublic?.latestUpdate.id ?? null,
          publishedAt: incidentPublic?.latestUpdate.publishedAt ?? null,
          restorationAt: incidentPublic?.latestUpdate.restorationAt ?? null,
        }
      : null,
    advisories: advisory.map((v) => ({
      id: v.id,
      version: v.version,
      state: v.state,
      current: isCurrent(v),
      kind: v.kind,
    })),
    rule: rules.map((v) => ({ id: v.id, version: v.version })),
    approved: approved.map((v) => ({ id: v.id, version: v.version })),
    connections: connections.map((v) => project(v, ['id', 'version', 'zoneId', 'zoneConfirmed'])),
    sessions: sessions.map((v) => ({
      id: v.id,
      version: v.version,
      siteVersion: v.site.version,
      availability: v.availability,
      remainingLiters: v.remainingLiters,
    })),
  };
  return {
    advisory,
    rule: rules[0],
    approved,
    incident: incidentPublic,
    incidentVersion: incident?.version ?? null,
    sessions,
    evidence,
    signature: digest(JSON.stringify(evidence)),
  };
}
