import type { SiteSupply } from "@aqours/contracts";
import type { DB } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import { stockAmounts } from "../../repositories/stock.repository.js";

export async function siteSupply(
  db: DB,
  siteId: string,
  active: boolean,
  capacity: string | null,
  now = new Date(),
): Promise<SiteSupply> {
  const sessions = active
    ? await db.pickupSession.findMany({
        where: { siteId, status: "open", endsAt: { gt: now } },
        orderBy: { id: "asc" },
      })
    : [];
  const totals = {
    totalLiters: new Prisma.Decimal(0),
    reservedLiters: new Prisma.Decimal(0),
    collectedLiters: new Prisma.Decimal(0),
    remainingLiters: new Prisma.Decimal(0),
  };
  for (const session of sessions) {
    const amounts = await stockAmounts(db, session.id);
    for (const key of Object.keys(totals) as (keyof typeof totals)[])
      totals[key] = totals[key].plus(amounts[key]);
  }
  return {
    available: sessions.length > 0,
    sessionIds: sessions.map((s) => s.id),
    sessionCount: sessions.length,
    totalLiters: totals.totalLiters.toFixed(2),
    reservedLiters: totals.reservedLiters.toFixed(2),
    collectedLiters: totals.collectedLiters.toFixed(2),
    remainingLiters: totals.remainingLiters.toFixed(2),
    observedAt: now.toISOString(),
    capacityPercentage: capacity
      ? totals.remainingLiters.div(capacity).mul(100).toNumber()
      : null,
  };
}
