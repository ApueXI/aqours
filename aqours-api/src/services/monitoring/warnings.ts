import type {
  MonitoringEvidence,
  MonitoringWarning,
  MonitoringWarningHistory,
} from "@aqours/contracts";
import type { DB } from "../../config/database.js";
import type {
  MonitoringWarning as WarningRow,
  MonitoringHistory,
} from "../../generated/prisma/client.js";
import { randomUUID } from "node:crypto";
import { json } from "./context.js";
export const warningShape = (row: WarningRow) =>
  ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }) as unknown as MonitoringWarning;
export const historyShape = (row: MonitoringHistory) =>
  ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }) as unknown as MonitoringWarningHistory;
export interface WarningTransition {
  supplierId: string;
  siteId: string;
  siteName: string;
  family: MonitoringWarning["family"];
  forecastDate: string;
  severity: MonitoringWarning["severity"] | null;
  state: MonitoringWarning["state"];
  evidence: MonitoringEvidence;
  reason: string | null;
  now: Date;
}
export async function transitionWarning(db: DB, input: WarningTransition) {
  const current = await db.monitoringWarning.findFirst({
    where: {
      siteId: input.siteId,
      family: input.family,
      forecastDate: input.forecastDate,
      state: "active",
    },
  });
  if (!current && (input.state !== "active" || !input.severity)) return null;
  const sameStatus =
    current &&
    current.state === input.state &&
    current.severity === input.severity;
  const evidenceValues = (value: unknown) =>
    Object.entries(value as MonitoringEvidence)
      .filter(([key]) => key !== "supplyObservedAt")
      .sort(([a], [b]) => a.localeCompare(b));
  if (
    sameStatus &&
    current.siteName === input.siteName &&
    JSON.stringify(evidenceValues(current.evidence)) ===
      JSON.stringify(evidenceValues(input.evidence))
  )
    return null;
  const severity = input.severity ?? current!.severity;
  const type =
    input.family === "combined"
      ? "combined"
      : input.family === "temperature"
        ? severity === "critical"
          ? "critical_temperature"
          : "high_temperature"
        : severity === "critical"
          ? "critical_supply"
          : "low_supply";
  const revision = (current?.revision ?? 0) + 1;
  const data = {
    severity,
    siteName: input.siteName,
    type,
    state: input.state,
    evidence: json(input.evidence),
    updatedAt: input.now,
    closedReason: input.reason,
    revision,
  };
  const row = current
    ? await db.monitoringWarning.update({ where: { id: current.id }, data })
    : await db.monitoringWarning.create({
        data: {
          id: randomUUID(),
          supplierId: input.supplierId,
          siteId: input.siteId,
          family: input.family,
          forecastDate: input.forecastDate,
          createdAt: input.now,
          ...data,
        },
      });
  const action = !current
    ? "triggered"
    : sameStatus
      ? "updated"
      : input.state !== "active"
        ? input.state
        : severity === "critical"
          ? "escalated"
          : "deescalated";
  await db.monitoringHistory.create({
    data: {
      id: randomUUID(),
      warningId: row.id,
      revision,
      action,
      severity,
      state: input.state,
      evidence: json(input.evidence),
      createdAt: input.now,
      reason: input.reason,
    },
  });
  return { row, action };
}
export async function notifyTransitions(
  db: DB,
  supplierId: string,
  siteId: string,
  siteName: string,
  changes: NonNullable<Awaited<ReturnType<typeof transitionWarning>>>[],
  now: Date,
) {
  changes = changes.filter((change) => change.action !== "updated");
  if (!changes.length) return;
  const recipients = await db.user.findMany({
    where: { active: true, role: { in: ["staff", "admin"] } },
    select: { id: true },
  });
  const key = `monitoring:${siteId}:${changes
    .map((c) => `${c.row.id}:${c.row.revision}`)
    .sort()
    .join(",")}`;
  const text = changes
    .map(
      (c) =>
        `${c.row.family} ${c.row.forecastDate}: ${c.row.severity} ${c.action}`,
    )
    .join("; ");
  await db.notification.createMany({
    skipDuplicates: true,
    data: recipients.map((user) => ({
      id: randomUUID(),
      userId: user.id,
      sourceEventKey: key,
      createdAt: now,
      data: {
        supplierId,
        siteId,
        targetId: siteId,
        targetType: "monitoring",
        title: `${siteName}: distribution warning update`,
        text,
      },
    })),
  });
}
