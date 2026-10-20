import { z } from "zod";
import type { DB } from "../../config/database.js";
import { mapReports } from "../../repositories/analytics.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { validateFilters } from "../../utils/query.js";
import { instant } from "../../validators/common.js";

export async function getMapReports(db: DB, req: CommandContext) {
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
    fail(400, "Bounds must be ordered and cannot cross the antimeridian");
  validateFilters(req);
  const from = req.query.from ? instant.parse(req.query.from) : null,
    to = req.query.to ? instant.parse(req.query.to) : null;
  if (from && to && from >= to) fail(400, "Invalid date interval");
  const result = await mapReports(db, bounds, req.query, from, to);
  const total = result.total;
  return {
    type: "FeatureCollection",
    features: result.rows.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
      properties: {
        id: v.id,
        reference: v.reference,
        category: v.category,
        status: v.status,
        priority: v.priority,
        address: v.address,
        structuredAddress: v.structuredAddress,
        locationSource: v.locationSource,
        locationReview: v.locationReview || !v.zoneConfirmed,
      },
    })),
    unlocatedCount: result.unlocated,
    total,
    truncated: total > bounds.limit,
    limit: bounds.limit,
  };
}
