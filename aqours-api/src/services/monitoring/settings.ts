import type { SiteMonitoringConfig, TemperatureBands } from "@aqours/contracts";
import type { DB } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";
import { event } from "../../repositories/history.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { z } from "zod";
import { text, totalLiters, liters } from "../../validators/common.js";
import { monitoringSite, monitoringSupplier } from "./context.js";
export const monitoringConfigInput = z
  .object({
    expectedVersion: z.number().int().min(0),
    enabled: z.boolean(),
    warningTemperature: z.number().finite(),
    criticalTemperature: z.number().finite(),
    lowSupplyLiters: totalLiters,
    criticalSupplyLiters: totalLiters,
    capacityLiters: liters.nullable(),
    reason: text,
  })
  .strict()
  .refine(
    (v) => v.criticalTemperature > v.warningTemperature,
    "Critical temperature must exceed warning",
  )
  .refine(
    (v) => new Prisma.Decimal(v.lowSupplyLiters).gt(v.criticalSupplyLiters),
    "Low supply must exceed critical supply",
  );
export const bandsInput = z
  .object({
    expectedVersion: z.number().int().min(0),
    boundaries: z
      .array(z.number().finite())
      .length(4)
      .refine((a) => a.every((v, i) => !i || v > a[i - 1]!)),
    reason: text,
  })
  .strict();
export async function getSiteConfig(
  db: DB,
  siteId: string,
): Promise<SiteMonitoringConfig | null> {
  const row = await db.monitoringConfig.findUnique({ where: { siteId } });
  return row
    ? {
        ...row,
        lowSupplyLiters: row.lowSupplyLiters.toFixed(2),
        criticalSupplyLiters: row.criticalSupplyLiters.toFixed(2),
        capacityLiters: row.capacityLiters?.toFixed(2) ?? null,
        updatedAt: row.updatedAt.toISOString(),
      }
    : null;
}
export async function configureSiteMonitoring(db: DB, req: CommandContext) {
  const input = monitoringConfigInput.parse(req.body),
    siteId = String(req.params.id);
  const { supplier } = await monitoringSite(db, siteId);
  await db.$queryRaw`SELECT id FROM pickup_sites WHERE id=${siteId}::uuid FOR UPDATE`;
  const previous = await getSiteConfig(db, siteId);
  if ((previous?.version ?? 0) !== input.expectedVersion)
    fail(409, "Monitoring configuration changed", "version_conflict");
  const { expectedVersion, reason, ...values } = input;
  const data = {
    ...values,
    version: expectedVersion + 1,
    updatedAt: new Date(),
  };
  await db.monitoringConfig.upsert({
    where: { siteId },
    create: { ...data, siteId, supplierId: supplier.id },
    update: data,
  });
  await event(
    db,
    req.actor.id,
    siteId,
    "monitoring_configured",
    reason,
    undefined,
    undefined,
    true,
    { previous, current: { ...data, supplierId: supplier.id } },
  );
  return getSiteConfig(db, siteId);
}
export async function temperatureBands(db: DB): Promise<TemperatureBands> {
  const supplier = await monitoringSupplier(db);
  const row = await db.monitoringBands.findUnique({
    where: { supplierId: supplier.id },
  });
  return row
    ? { version: row.version, boundaries: row.boundaries as number[] }
    : { version: 0, boundaries: [25, 30, 34, 37] };
}
export async function configureBands(db: DB, req: CommandContext) {
  const supplier = await monitoringSupplier(db),
    input = bandsInput.parse(req.body);
  await db.$queryRaw`SELECT id FROM suppliers WHERE id=${supplier.id}::uuid FOR UPDATE`;
  const previous = await temperatureBands(db);
  if (previous.version !== input.expectedVersion)
    fail(409, "Temperature bands changed", "version_conflict");
  const data = {
    version: input.expectedVersion + 1,
    boundaries: input.boundaries,
  };
  await db.monitoringBands.upsert({
    where: { supplierId: supplier.id },
    create: { supplierId: supplier.id, ...data },
    update: data,
  });
  await event(
    db,
    req.actor.id,
    supplier.id,
    "temperature_bands_configured",
    input.reason,
    undefined,
    undefined,
    true,
    { previous, current: data },
  );
  return data;
}
