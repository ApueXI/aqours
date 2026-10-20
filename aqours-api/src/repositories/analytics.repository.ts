import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";

export interface Bounds {
  west: number;
  east: number;
  south: number;
  north: number;
  limit: number;
}
export async function mapReports(
  db: DB,
  bounds: Bounds,
  filters: Record<string, any>,
  from: string | null,
  to: string | null,
) {
  const where: Prisma.ReportWhereInput = {};
  for (const key of [
    "category",
    "status",
    "zoneId",
    "ownerId",
    "priority",
  ] as const)
    if (filters[key]) where[key] = filters[key];
  if (from || to)
    where.submittedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lt: new Date(to) } : {}),
    };
  const viewport = {
    ...where,
    longitude: { gte: bounds.west, lte: bounds.east },
    latitude: { gte: bounds.south, lte: bounds.north },
  };
  const unlocated = await db.report.count({
    where: { ...where, latitude: null },
  });
  const total = await db.report.count({ where: viewport });
  const rows = await db.report.findMany({
    where: viewport,
    take: bounds.limit,
    orderBy: [{ storedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      latitude: true,
      longitude: true,
      reference: true,
      category: true,
      status: true,
      priority: true,
      address: true,
      structuredAddress: true,
      locationSource: true,
      locationReview: true,
      zoneConfirmed: true,
    },
  });
  return { rows, total, unlocated };
}
export const reopenedTargets = (db: DB) =>
  db.event.findMany({
    where: { action: "still_affected" },
    select: { targetId: true },
    distinct: ["targetId"],
  });
