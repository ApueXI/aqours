import { randomUUID } from "node:crypto";
import type { DB } from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";
import { fail } from "../utils/errors.js";

export async function stockAmounts(db: DB, sessionId: string) {
  const session = await db.stockSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) fail(404, "Pickup session not found");
  const amounts = await db.allocation.groupBy({
    by: ["state"],
    where: { sessionId },
    _sum: { liters: true },
  });
  const sum = (state: string) =>
    amounts.find((a) => a.state === state)?._sum.liters ??
    new Prisma.Decimal(0);
  const reserved = sum("reserved"),
    collected = sum("collected");
  return {
    totalLiters: session.total.toFixed(2),
    reservedLiters: reserved.toFixed(2),
    collectedLiters: collected.toFixed(2),
    remainingLiters: session.total.minus(reserved).minus(collected).toFixed(2),
  };
}
export async function getAllocation(db: DB, requestId: string, lock = false) {
  if (lock)
    await db.$queryRaw`SELECT id FROM allocations WHERE request_id=${requestId}::uuid FOR UPDATE`;
  const row = await db.allocation.findUnique({ where: { requestId } });
  return row ? { ...row, liters: row.liters.toFixed(2) } : null;
}
export const insertStock = (db: DB, id: string, total: string) =>
  db.stockSession.create({ data: { id, total } });
export async function changeTotal(db: DB, id: string, total: string) {
  const stock = await stockAmounts(db, id);
  if (
    new Prisma.Decimal(total).lessThan(
      new Prisma.Decimal(stock.reservedLiters).plus(stock.collectedLiters),
    )
  )
    fail(
      409,
      "Stock cannot be lower than reservations and collections",
      "stock",
    );
  await db.stockSession.update({ where: { id }, data: { total } });
}
export const insertAllocation = (
  db: DB,
  requestId: string,
  sessionId: string,
  liters: string,
  reference: string,
) =>
  db.allocation.create({
    data: {
      id: randomUUID(),
      requestId,
      sessionId,
      liters,
      reference,
      state: "reserved",
    },
  });
export const allocationRequest = (db: DB, id: string) =>
  db.allocation.findUnique({ where: { id }, select: { requestId: true } });
export const collectAllocation = (db: DB, id: string) =>
  db.allocation.updateMany({
    where: { id, state: "reserved" },
    data: { state: "collected", collectedAt: new Date() },
  });
export const releaseAllocation = (db: DB, id: string) =>
  db.allocation.updateMany({
    where: { id, state: "reserved" },
    data: { state: "released", releasedAt: new Date() },
  });
