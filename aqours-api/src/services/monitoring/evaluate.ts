import type { MonitoringWarning } from "@aqours/contracts";
import { transaction } from "../../config/database.js";
import { monitoringDates, monitoringSite } from "./context.js";
import { monitoringEvidence, highest } from "./evidence.js";
import { siteSnapshot } from "./snapshot.js";
import { notifyTransitions, transitionWarning } from "./warnings.js";

export async function evaluateSiteMonitoring(siteId: string, now = new Date()) {
  return transaction(async (db) => {
    const { supplier } = await monitoringSite(db, siteId);
    await db.monitoringWork.upsert({
      where: { siteId },
      create: { siteId, supplierId: supplier.id },
      update: {},
    });
    await db.$queryRaw`SELECT site_id FROM monitoring_work WHERE site_id=${siteId}::uuid FOR UPDATE`;
    const work = await db.monitoringWork.findUniqueOrThrow({
      where: { siteId },
    });
    const snapshot = await siteSnapshot(db, siteId, now),
      dates = monitoringDates(now);
    const site = snapshot.site;
    const enabled = site.active && snapshot.config?.enabled;
    const changes: NonNullable<
      Awaited<ReturnType<typeof transitionWarning>>
    >[] = [];
    for (const day of snapshot.days) {
      const evidence = monitoringEvidence(
        day,
        snapshot.config,
        snapshot.weather,
        snapshot.supply,
      );
      for (const family of ["temperature", "supply", "combined"] as const) {
        if (family === "supply" && day.date !== dates[0]) continue;
        const t = day.temperatureSeverity,
          s = day.supplySeverity;
        const triggered =
          family === "temperature"
            ? t !== null && t !== "normal"
            : family === "supply"
              ? s !== null && s !== "normal"
              : t !== null && s !== null && t !== "normal" && s !== "normal";
        const severity =
          family === "temperature"
            ? t
            : family === "supply"
              ? s
              : highest(t, s);
        const unavailable =
          !enabled ||
          (family !== "supply" && t === null) ||
          (family !== "temperature" && s === null);
        const stale =
          family !== "supply" && snapshot.weather.status !== "fresh";
        // Stale normal weather cannot resolve temperature or combined warnings.
        if (enabled && !unavailable && !triggered && stale) continue;
        const state: MonitoringWarning["state"] = unavailable
          ? "suspended"
          : triggered
            ? "active"
            : "resolved";
        const result = await transitionWarning(db, {
          supplierId: supplier.id,
          siteId,
          siteName: site.name,
          family,
          forecastDate: day.date,
          severity: triggered && severity !== "normal" ? severity : null,
          state,
          evidence,
          now,
          reason: unavailable
            ? "Monitoring disabled or required evidence unavailable"
            : state === "resolved"
              ? "Fresh evidence is within configured thresholds"
              : null,
        });
        if (result) changes.push(result);
      }
    }
    for (const old of snapshot.warnings.filter(
      (w) => w.forecastDate < dates[0]!,
    )) {
      const result = await transitionWarning(db, {
        supplierId: supplier.id,
        siteId,
        siteName: site.name,
        family: old.family,
        forecastDate: old.forecastDate,
        severity: null,
        state: "expired",
        evidence: old.evidence,
        now,
        reason: "Forecast date has passed in Asia/Manila",
      });
      if (result) changes.push(result);
    }
    await notifyTransitions(db, supplier.id, siteId, site.name, changes, now);
    await db.monitoringWork.update({
      where: { siteId },
      data: { evaluatedRevision: work.revision, sweptAt: now },
    });
    return { changed: changes.length, revision: work.revision };
  });
}
