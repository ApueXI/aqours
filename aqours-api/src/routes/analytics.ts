import type { Express } from 'express';
import { z } from 'zod';
import { route, filter, validateFilters } from '../http.js';
import { all, now } from '../store.js';
import { instant } from '../validation.js';
import { fail } from '../errors.js';
import { resolutionSummary } from '../services/metrics.js';
export function analyticsRoutes(app: Express) {
  route(app, 'get', '/staff/map/reports', 'staff', async (db, req) => {
    const bounds = z
      .object({
        west: z.coerce.number().finite().min(-180).max(180),
        south: z.coerce.number().finite().min(-90).max(90),
        east: z.coerce.number().finite().min(-180).max(180),
        north: z.coerce.number().finite().min(-90).max(90),
        limit: z.coerce.number().int().min(1).max(1000).default(1000),
      })
      .parse(req.query);
    if (bounds.west >= bounds.east || bounds.south >= bounds.north)
      fail(400, 'Bounds must be ordered and cannot cross the antimeridian');
    validateFilters(req);
    const params: unknown[] = [],
      clauses = ["kind='report'"];
    const parameter = (value: unknown) => {
      params.push(value);
      return '$' + params.length;
    };
    for (const field of ['category', 'status', 'zoneId', 'ownerId', 'priority']) {
      if (req.query[field])
        clauses.push(`data->>'${field}'=${parameter(z.string().max(100).parse(req.query[field]))}`);
    }
    const from = req.query.from ? instant.parse(req.query.from) : null,
      to = req.query.to ? instant.parse(req.query.to) : null;
    if (from && to && from >= to) fail(400, 'Invalid date interval');
    if (from) clauses.push(`(data->>'submittedAt')::timestamptz>=${parameter(from)}::timestamptz`);
    if (to) clauses.push(`(data->>'submittedAt')::timestamptz<${parameter(to)}::timestamptz`);
    const where = clauses.join(' AND ');
    const unlocated = await db.query(
      `SELECT count(*)::integer AS count FROM records WHERE ${where} AND latitude IS NULL`,
      params,
    );
    const bbox = `longitude BETWEEN ${parameter(bounds.west)} AND ${parameter(bounds.east)} AND latitude BETWEEN ${parameter(bounds.south)} AND ${parameter(bounds.north)}`;
    const count = await db.query(
      `SELECT count(*)::integer AS count FROM records WHERE ${where} AND ${bbox}`,
      params,
    );
    const result = await db.query(
      `SELECT id,data,latitude,longitude FROM records WHERE ${where} AND ${bbox} ORDER BY created_at DESC,id LIMIT ${parameter(bounds.limit)}`,
      params,
    );
    const total = count.rows[0].count;
    return {
      type: 'FeatureCollection',
      features: result.rows.map((v) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [v.longitude, v.latitude] },
        properties: {
          id: v.id,
          reference: v.data.reference,
          category: v.data.category,
          status: v.data.status,
          priority: v.data.priority,
        },
      })),
      unlocatedCount: unlocated.rows[0].count,
      total,
      truncated: total > bounds.limit,
      limit: bounds.limit,
    };
  });
  route(app, 'get', '/staff/metrics', 'staff', async (db, req) => {
    const asOf = now(),
      from = instant.parse(req.query.from ?? '1970-01-01T00:00:00.000Z'),
      to = instant.parse(req.query.to ?? asOf);
    if (from >= to) fail(400, 'Invalid metric cohort interval');
    const reports = filter(req, await all(db, 'report')).filter(
      (v) => v.submittedAt >= from && v.submittedAt < to,
    );
    const categories: Record<string, number> = {
      outage: 0,
      low_pressure: 0,
      leak: 0,
      water_quality: 0,
    };
    for (const report of reports)
      categories[report.category] = (categories[report.category] ?? 0) + 1;
    const samples = (field: string) =>
      reports
        .filter((v) => v[field])
        .map((v) => (new Date(v[field]).getTime() - new Date(v.submittedAt).getTime()) / 1000);
    const responses = samples('firstRespondedAt');
    const mean = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const reviewedClosures = reports.filter((v) =>
      ['duplicate', 'invalid'].includes(v.closureOutcome),
    ).length;
    const { rows } = await db.query(
      "SELECT DISTINCT target_id FROM events WHERE action='still_affected'",
    );
    return {
      from,
      to,
      asOf,
      timezone: 'Asia/Manila',
      cohort: 'Reports submitted at or after from and before to; arithmetic mean elapsed seconds',
      activeIncidents: (await all(db, 'incident')).filter((v) => v.status !== 'resolved').length,
      unresolvedReports: reports.filter((v) => v.status !== 'resolved').length,
      reportCount: reports.length,
      uniqueConnections: new Set(reports.map((v) => v.connectionId)).size,
      categories,
      reviewedClosures,
      reopenedReports: reports.filter((v) => rows.some((e) => e.target_id === v.id)).length,
      firstResponse: {
        meanSeconds: mean(responses),
        sampleCount: responses.length,
        pendingCount: reports.length - responses.length,
      },
      firstResolution: resolutionSummary(reports),
    };
  });
}
