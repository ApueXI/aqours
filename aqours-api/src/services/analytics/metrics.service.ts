import type { Doc } from "../../repositories/domain.repository.js";
export function resolutionSummary(reports: Doc[]) {
  const samples = reports.filter((v) => v.firstResolvedAt);
  const excluded = reports.filter(
    (v) =>
      !v.firstResolvedAt && ["duplicate", "invalid"].includes(v.closureOutcome),
  );
  const elapsed = samples.map(
    (v) =>
      (new Date(v.firstResolvedAt).getTime() -
        new Date(v.submittedAt).getTime()) /
      1000,
  );
  return {
    meanSeconds: elapsed.length
      ? elapsed.reduce((a, b) => a + b, 0) / elapsed.length
      : null,
    sampleCount: samples.length,
    excludedCount: excluded.length,
    pendingCount: reports.length - samples.length - excluded.length,
  };
}
