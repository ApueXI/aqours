import { prisma, transaction } from "../../config/database.js";
import { monitoringSupplier } from "./context.js";
import { evaluateSiteMonitoring } from "./evaluate.js";
import { refreshSiteForecast, type MonitoringOptions } from "./forecast.js";

/** One durable-work pass. Provider requests run outside inventory transactions. */
export async function runMonitoringTick(options: MonitoringOptions = {}) {
  const now = options.now ?? new Date();
  const supplier = await monitoringSupplier(prisma);
  await transaction(async (db) => {
    await db.$executeRaw`INSERT INTO monitoring_work(site_id,supplier_id)
      SELECT id,${supplier.id}::uuid FROM pickup_sites ON CONFLICT(site_id) DO NOTHING`;
  });
  const work = await prisma.monitoringWork.findMany({
    where: { supplierId: supplier.id },
    orderBy: { siteId: "asc" },
  });
  // Evaluation does not wait for slow forecasts; stock changes stay responsive.
  for (const item of work) {
    if (options.signal?.aborted) break;
    if (
      item.revision > item.evaluatedRevision ||
      !item.sweptAt ||
      now.getTime() - item.sweptAt.getTime() >= 60000
    )
      await evaluateSiteMonitoring(item.siteId, now);
  }
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(3, work.length) }, async () => {
      while (index < work.length && !options.signal?.aborted) {
        const item = work[index++]!;
        if (await refreshSiteForecast(item.siteId, options))
          await evaluateSiteMonitoring(item.siteId, now);
      }
    }),
  );
  return { sites: work.length };
}
export function startMonitoringScheduler() {
  let stopped = false;
  const abort = new AbortController();
  const pending = new Set<Promise<unknown>>();
  let refreshing = false;
  const tick = () => {
    if (stopped) return;
    const task = (async () => {
      const now = new Date();
      if (!refreshing) {
        refreshing = true;
        try {
          await runMonitoringTick({ now, signal: abort.signal });
        } finally {
          refreshing = false;
        }
      } else {
        // Independent evaluation while a previous forecast batch is awaiting the provider.
        const dirty = await prisma.monitoringWork.findMany();
        for (const item of dirty)
          if (
            !stopped &&
            (item.revision > item.evaluatedRevision ||
              !item.sweptAt ||
              now.getTime() - item.sweptAt.getTime() >= 60000)
          )
            await evaluateSiteMonitoring(item.siteId, now);
      }
    })().catch(() =>
      console.error(
        "Distribution monitoring tick failed; durable work remains queued",
      ),
    );
    pending.add(task);
    void task.finally(() => pending.delete(task));
  };
  const timer = setInterval(tick, 4000);
  timer.unref();
  tick();
  return async () => {
    stopped = true;
    abort.abort();
    clearInterval(timer);
    await Promise.allSettled([...pending]);
  };
}
