import type { SupplierMonitoringNotification } from "@aqours/contracts";
import type { DB } from "../../config/database.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { page } from "../../utils/query.js";
import { z } from "zod";
import {
  monitoringDates,
  monitoringSite,
  monitoringSupplier,
} from "./context.js";
import { queueSiteForecast } from "./forecast.js";
import { temperatureBands } from "./settings.js";
import { siteSnapshot } from "./snapshot.js";
import { historyShape, warningShape } from "./warnings.js";
const filters = z.object({
  siteId: z.uuid().optional(),
  date: z.iso.date().optional(),
  state: z.enum(["active", "resolved", "expired", "suspended"]).optional(),
});
export async function monitoringOverview(db: DB) {
  const supplier = await monitoringSupplier(db),
    now = new Date();
  const sites = await db.pickupSite.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  const snapshots = [];
  for (const site of sites) {
    await queueSiteForecast(db, site.id, now);
    snapshots.push(await siteSnapshot(db, site.id, now));
  }
  return {
    supplier: { id: supplier.id, name: supplier.name },
    asOf: now.toISOString(),
    dates: monitoringDates(now),
    sites: snapshots,
    temperatureBands: await temperatureBands(db),
  };
}
export async function listMonitoringWarnings(db: DB, req: CommandContext) {
  const supplier = await monitoringSupplier(db),
    query = filters.parse(req.query);
  if (query.siteId) await monitoringSite(db, query.siteId);
  const rows = await db.monitoringWarning.findMany({
    where: {
      supplierId: supplier.id,
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.date ? { forecastDate: query.date } : {}),
      ...(query.state ? { state: query.state } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
  return page(req, rows.map(warningShape));
}
export async function monitoringWarningDetail(db: DB, id: string) {
  const supplier = await monitoringSupplier(db);
  const row = await db.monitoringWarning.findFirst({
    where: { id, supplierId: supplier.id },
  });
  if (!row) fail(404, "Warning not found", "not_found");
  const history = await db.monitoringHistory.findMany({
    where: { warningId: id },
    orderBy: { revision: "asc" },
  });
  return { warning: warningShape(row), history: history.map(historyShape) };
}
const notificationShape = (row: {
  id: string;
  data: unknown;
  createdAt: Date;
  readAt: Date | null;
}): SupplierMonitoringNotification => {
  const data = row.data as { siteId: string; title: string; text: string };
  return {
    id: row.id,
    siteId: data.siteId,
    title: data.title,
    text: data.text,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
};
export async function monitoringNotifications(db: DB, req: CommandContext) {
  const supplier = await monitoringSupplier(db);
  const rows = await db.notification.findMany({
    where: {
      userId: req.actor.id,
      AND: [
        { data: { path: ["targetType"], equals: "monitoring" } },
        { data: { path: ["supplierId"], equals: supplier.id } },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return page(req, rows.map(notificationShape));
}
export async function readMonitoringNotification(db: DB, req: CommandContext) {
  const supplier = await monitoringSupplier(db),
    id = String(req.params.id);
  const row = await db.notification.findFirst({
    where: {
      id,
      userId: req.actor.id,
      AND: [
        { data: { path: ["targetType"], equals: "monitoring" } },
        { data: { path: ["supplierId"], equals: supplier.id } },
      ],
    },
  });
  if (!row) fail(404, "Notification not found", "not_found");
  if (!row.readAt)
    return notificationShape(
      await db.notification.update({
        where: { id },
        data: { readAt: new Date() },
      }),
    );
  return notificationShape(row);
}
