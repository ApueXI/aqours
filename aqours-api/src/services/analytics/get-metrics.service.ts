import type { DB } from "../../config/database.js";
import { reopenedTargets } from "../../repositories/analytics.repository.js";
import { all, now } from "../../repositories/domain.repository.js";
import { resolutionSummary } from "./metrics.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { filter } from "../../utils/query.js";
import { instant } from "../../validators/common.js";

export async function getMetrics(db: DB, req: CommandContext) {
  const asOf = now(),
    from = instant.parse(req.query.from ?? "1970-01-01T00:00:00.000Z"),
    to = instant.parse(req.query.to ?? asOf);
  if (from >= to) fail(400, "Invalid metric cohort interval");
  const reports = filter(req, await all(db, "report")).filter(
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
      .map(
        (v) =>
          (new Date(v[field]).getTime() - new Date(v.submittedAt).getTime()) /
          1000,
      );
  const responses = samples("firstRespondedAt");
  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const reviewedClosures = reports.filter((v) =>
    ["duplicate", "invalid"].includes(v.closureOutcome),
  ).length;
  const rows = await reopenedTargets(db);
  return {
    from,
    to,
    asOf,
    timezone: "Asia/Manila",
    cohort:
      "Reports submitted at or after from and before to; arithmetic mean elapsed seconds",
    activeIncidents: (await all(db, "incident")).filter(
      (v) => v.status !== "resolved",
    ).length,
    unresolvedReports: reports.filter((v) => v.status !== "resolved").length,
    reportCount: reports.length,
    uniqueConnections: new Set(reports.map((v) => v.connectionId)).size,
    categories,
    reviewedClosures,
    reopenedReports: reports.filter((v) =>
      rows.some((e) => e.targetId === v.id),
    ).length,
    firstResponse: {
      meanSeconds: mean(responses),
      sampleCount: responses.length,
      pendingCount: reports.length - responses.length,
    },
    firstResolution: resolutionSummary(reports),
  };
}
