import type { DB } from "../../config/database.js";
import { fail } from "../../utils/errors.js";
export async function monitoringSupplier(db: DB) {
  const suppliers = await db.supplier.findMany({ take: 2 });
  if (suppliers.length !== 1)
    fail(
      503,
      "Distribution monitoring requires exactly one configured supplier",
      "supplier_configuration",
    );
  return suppliers[0]!;
}
export async function monitoringSite(db: DB, siteId: string) {
  const supplier = await monitoringSupplier(db);
  const site = await db.pickupSite.findUnique({ where: { id: siteId } });
  if (!site) fail(404, "Pickup site not found", "not_found");
  return { supplier, site };
}
export const coordinateKey = (site: {
  latitude: number | null;
  longitude: number | null;
}) => `${site.latitude},${site.longitude}`;
export function monitoringDates(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(`${date}T00:00:00+08:00`) + i * 86400000 + 28800000)
      .toISOString()
      .slice(0, 10),
  );
}
export const json = <T>(value: T) => JSON.parse(JSON.stringify(value));
