import type { SiteForecast, WeatherForecast } from "@aqours/contracts";
import { transaction, type DB } from "../../config/database.js";
import { advisoryLock } from "../../repositories/locks.repository.js";
import { Prisma } from "../../generated/prisma/client.js";
import { randomUUID } from "node:crypto";
import { getForecast } from "../weather/forecast.service.js";
import { coordinateKey, json, monitoringSite } from "./context.js";
export interface MonitoringOptions {
  now?: Date;
  signal?: AbortSignal;
  forecastLoader?: (
    latitude: number,
    longitude: number,
  ) => Promise<WeatherForecast>;
}
export async function siteForecast(
  db: DB,
  siteId: string,
  now = new Date(),
): Promise<SiteForecast> {
  const { site } = await monitoringSite(db, siteId);
  if (site.latitude === null || site.longitude === null)
    return {
      status: "unlocated",
      forecast: null,
      lastAttemptAt: null,
      lastSuccessAt: null,
      nextRefreshAt: null,
      error: null,
    };
  const row = await db.monitoringForecast.findUnique({ where: { siteId } });
  const valid = row?.coordinateKey === coordinateKey(site);
  const forecast =
    valid && row?.forecast
      ? (row.forecast as unknown as WeatherForecast)
      : null;
  const age =
    valid && row?.lastSuccessAt
      ? now.getTime() - row.lastSuccessAt.getTime()
      : Infinity;
  const status =
    !row || !valid
      ? "missing"
      : !forecast || age >= 21600000
        ? "unavailable"
        : row.error || age >= 3600000
          ? "stale"
          : "fresh";
  return {
    status,
    forecast,
    lastAttemptAt: row?.lastAttemptAt?.toISOString() ?? null,
    lastSuccessAt: row?.lastSuccessAt?.toISOString() ?? null,
    nextRefreshAt: row?.nextRefreshAt?.toISOString() ?? null,
    error: row?.error ?? null,
  };
}
export async function queueSiteForecast(
  db: DB,
  siteId: string,
  now = new Date(),
) {
  const { supplier, site } = await monitoringSite(db, siteId);
  if (!site.active || site.latitude === null || site.longitude === null)
    return false;
  const saved = await db.monitoringForecast.findUnique({ where: { siteId } });
  if (
    saved &&
    saved.coordinateKey === coordinateKey(site) &&
    saved.nextRefreshAt > now
  )
    return false;
  await db.monitoringWork.upsert({
    where: { siteId },
    create: { siteId, supplierId: supplier.id },
    update: {},
  });
  return true;
}
export async function refreshSiteForecast(
  siteId: string,
  options: MonitoringOptions = {},
) {
  const now = options.now ?? new Date();
  const claimed = await transaction(async (db) => {
    const context = await monitoringSite(db, siteId);
    const supplier = context.supplier;
    let site = context.site;
    if (!site.active || site.latitude === null || site.longitude === null)
      return null;
    await db.monitoringWork.upsert({
      where: { siteId },
      create: { siteId, supplierId: supplier.id },
      update: {},
    });
    await db.$queryRaw`SELECT site_id FROM monitoring_work WHERE site_id=${siteId}::uuid FOR UPDATE`;
    site = await db.pickupSite.findUniqueOrThrow({ where: { id: siteId } });
    if (!site.active || site.latitude === null || site.longitude === null)
      return null;
    const work = await db.monitoringWork.findUniqueOrThrow({
      where: { siteId },
    });
    const saved = await db.monitoringForecast.findUnique({ where: { siteId } });
    if (
      (work.leaseUntil && work.leaseUntil > now) ||
      (saved &&
        saved.nextRefreshAt > now &&
        saved.coordinateKey === coordinateKey(site))
    )
      return null;
    // Serialize global lease claims across API processes, with three provider slots.
    await advisoryLock(db, "aqours-monitoring-provider-slots");
    const leased = await db.monitoringWork.count({
      where: { leaseUntil: { gt: now } },
    });
    if (leased >= 3) return null;
    const token = randomUUID();
    await db.monitoringWork.update({
      where: { siteId },
      data: { leaseToken: token, leaseUntil: new Date(now.getTime() + 60000) },
    });
    await db.monitoringForecast.upsert({
      where: { siteId },
      create: {
        siteId,
        supplierId: supplier.id,
        coordinateKey: coordinateKey(site),
        lastAttemptAt: now,
        nextRefreshAt: now,
      },
      update: { lastAttemptAt: now },
    });
    return { site, token };
  });
  if (!claimed) return false;
  let forecast: WeatherForecast | null = null;
  try {
    forecast = await (options.forecastLoader ?? getForecast)(
      claimed.site.latitude!,
      claimed.site.longitude!,
    );
  } catch {
    /* A failed provider attempt retains the last successful forecast. */
  }
  await transaction(async (db) => {
    await db.$queryRaw`SELECT site_id FROM monitoring_work WHERE site_id=${siteId}::uuid FOR UPDATE`;
    const work = await db.monitoringWork.findUniqueOrThrow({
      where: { siteId },
    });
    const site = await db.pickupSite.findUniqueOrThrow({
      where: { id: siteId },
    });
    if (
      work.leaseToken !== claimed.token ||
      coordinateKey(site) !== coordinateKey(claimed.site)
    )
      return;
    const previous = await db.monitoringForecast.findUniqueOrThrow({
      where: { siteId },
    });
    const failures = forecast ? 0 : previous.failures + 1;
    const delay =
      forecast || failures >= 3 ? 3600000 : 60000 * 2 ** (failures - 1);
    await db.monitoringForecast.update({
      where: { siteId },
      data: {
        forecast: forecast
          ? json(forecast)
          : (previous.forecast ?? Prisma.DbNull),
        ...(forecast ? { lastSuccessAt: now } : {}),
        error: forecast ? null : "Weather provider temporarily unavailable",
        failures,
        nextRefreshAt: new Date(now.getTime() + delay),
      },
    });
    await db.monitoringWork.update({
      where: { siteId },
      data: { leaseToken: null, leaseUntil: null, revision: { increment: 1 } },
    });
  });
  return true;
}
