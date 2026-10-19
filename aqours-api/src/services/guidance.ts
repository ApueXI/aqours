import type { DB } from '../db.js';
import { now, type Doc } from '../store.js';
import { qualityKinds } from './advisories.js';
import { context } from './guidance-context.js';
export async function evaluate(db: DB, report: Doc, answers: Record<string, any>) {
  const ctx = await context(db, report),
    evaluatedAt = now();
  const cards: Record<string, any>[] = [],
    uncertainty: string[] = [];
  const card = (
    action: string,
    title: string,
    reason: string,
    source: string,
    sourceId: string | null = null,
    sourceVersion: number | null = null,
    updatedAt = evaluatedAt,
    sourceType = 'rule',
  ) => cards.push({ action, title, reason, source, sourceId, sourceVersion, updatedAt, sourceType });
  const active = ctx.advisory.filter(
    (v) =>
      v.state === 'published' &&
      (qualityKinds.includes(v.kind) ||
        ((!v.startsAt || v.startsAt <= evaluatedAt) && (!v.endsAt || v.endsAt > evaluatedAt))),
  );
  const rank = ['do_not_use', 'do_not_drink', 'boil_water', 'scheduled_interruption', 'general'];
  active.sort((a, b) => rank.indexOf(a.kind) - rank.indexOf(b.kind));
  for (const notice of active)
    card(
      'notice',
      `${notice.demo ? 'Demonstration: ' : ''}${notice.title}`,
      notice.text,
      notice.source,
      notice.id,
      notice.version,
      notice.updatedAt,
      'advisory',
    );
  if (new Set(active.filter((v) => qualityKinds.includes(v.kind)).map((v) => v.kind)).size > 1)
    uncertainty.push(
      'Multiple official restrictions apply. Contact supplier support to clarify; do not assume a restriction has been lifted.',
    );
  if (!report.zoneConfirmed)
    uncertainty.push('Issue service zone is unconfirmed; staff review is needed.');
  if (!report.locationConfirmed)
    uncertainty.push(
      'Issue coordinates are unavailable or unconfirmed; the saved address remains usable for support.',
    );
  const incident = ctx.incident;
  if (incident)
    card(
      'incident',
      `${incident.demo ? 'Demonstration: ' : ''}${incident.summary}`,
      `${incident.latestUpdate.progress} Restoration: ${incident.latestUpdate.restorationAt ?? 'unknown'}`,
      `${incident.demo ? 'Demonstration: ' : ''}Published supplier incident update`,
      incident.id,
      ctx.incidentVersion,
      incident.latestUpdate.publishedAt,
      'incident',
    );
  if (answers.hazard)
    card(
      'escalation',
      'Contact supplier support promptly',
      ctx.rule?.contactText ?? 'Describe the hazard to supplier support. Avoid unsafe repairs.',
      'Supplier contact rule',
      ctx.rule?.id ?? null,
      ctx.rule?.version ?? null,
    );
  if (report.category === 'water_quality' && !active.some((v) => qualityKinds.includes(v.kind))) {
    uncertainty.push(
      'No applicable published quality restriction is confirmed. Appearance and photographs cannot determine water safety.',
    );
    const approved = ctx.approved
      .filter((v) => v.kind === 'general')
      .sort((a, b) => b.version - a.version)[0];
    if (approved)
      card(
        'notice',
        'Supplier approved information',
        approved.text,
        approved.source,
        approved.id,
        approved.version,
        approved.createdAt,
        'guidance',
      );
  }
  if (
    report.category === 'leak' ||
    (report.category === 'low_pressure' && !incident) ||
    answers.persistent ||
    report.status === 'resolved'
  )
    card(
      'inspection',
      'Request an inspection',
      ctx.rule?.inspectionText ??
        'Staff can assess the reported conditions; this does not diagnose a household fault.',
      'Supplier inspection rule',
      ctx.rule?.id ?? null,
      ctx.rule?.version ?? null,
    );
  const restoration = incident?.latestUpdate.restorationAt;
  if (
    answers.needsWater &&
    (!restoration || !answers.waterNeededBy || answers.waterNeededBy < restoration)
  ) {
    const available = ctx.sessions.find(
      (v) =>
        v.availability === 'available' && report.zoneConfirmed && v.zoneIds.includes(report.zoneId),
    );
    if (available)
      card(
        'water_support',
        `${available.demo ? 'Demonstration: ' : ''}Request water pickup support`,
        `${ctx.rule?.waterText ?? 'Choose a pickup session; staff must accept and reserve liters.'} ${available.site.name}: ${available.remainingLiters} liters currently available.`,
        `${available.demo ? 'Demonstration: ' : ''}Current pickup session`,
        available.id,
        available.version,
        available.updatedAt,
        'pickup',
      );
    else
      uncertainty.push(
        'No eligible pickup availability is confirmed. Request supplier callback/support for alternatives.',
      );
  }
  card(
    'callback',
    'Request supplier callback',
    ctx.rule?.contactText ?? 'Ask supplier support to review your concern and arrange follow-up.',
    'Supplier contact rule',
    ctx.rule?.id ?? null,
    ctx.rule?.version ?? null,
  );
  return {
    reportId: report.id,
    evaluatedAt,
    ruleVersion: ctx.rule?.version ?? 1,
    current: true,
    uncertainty,
    questions: [
      {
        key: 'hazard',
        label: 'Is there a hazard requiring prompt supplier review?',
        options: ['yes', 'no'],
      },
      {
        key: 'needsWater',
        label: 'Do you need water before service returns?',
        options: ['yes', 'no'],
      },
      {
        key: 'persistent',
        label: 'Does this problem persist after an update?',
        options: ['yes', 'no'],
      },
      {
        key: 'nearbyAffected',
        label: 'Are nearby connections affected?',
        options: ['yes', 'no', 'unknown'],
      },
    ],
    cards,
    alternatives: ['callback', 'inspection', 'water_support'],
    sourceSignature: ctx.signature,
    evidence: ctx.evidence,
  };
}
