import type { MonitoredSite, PickupSite } from "@aqours/contracts";
import type { DB } from "../../config/database.js";
import { monitoringDates, monitoringSite } from "./context.js";
import { monitoringDay } from "./evidence.js";
import { siteForecast } from "./forecast.js";
import { getSiteConfig } from "./settings.js";
import { siteSupply } from "./supply.js";
import { siteSafe } from "../presentation/projection.js";
import { warningShape } from "./warnings.js";
export async function siteSnapshot(
  db: DB,
  siteId: string,
  now = new Date(),
): Promise<MonitoredSite> {
  const { site, supplier } = await monitoringSite(db, siteId);
  const config = await getSiteConfig(db, siteId),
    weather = await siteForecast(db, siteId, now);
  const supply = await siteSupply(
    db,
    siteId,
    site.active,
    config?.capacityLiters ?? null,
    now,
  );
  const rows = await db.monitoringWarning.findMany({
    where: { supplierId: supplier.id, siteId, state: "active" },
    orderBy: [{ forecastDate: "asc" }, { family: "asc" }],
  });
  return {
    site: siteSafe(site) as unknown as PickupSite,
    config,
    weather,
    supply,
    warnings: rows.map(warningShape),
    days: monitoringDates(now).map((date) =>
      monitoringDay(date, config, site.active, weather, supply),
    ),
  };
}
