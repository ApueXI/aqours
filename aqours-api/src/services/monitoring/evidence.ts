import type {
  MonitoringDay,
  MonitoringEvidence,
  MonitoringSeverity,
  SiteMonitoringConfig,
  SiteSupply,
  SiteForecast,
} from "@aqours/contracts";
import { Prisma } from "../../generated/prisma/client.js";
export function temperatureSeverity(
  value: number | null,
  config: SiteMonitoringConfig,
): MonitoringSeverity | null {
  return value === null
    ? null
    : value >= config.criticalTemperature
      ? "critical"
      : value >= config.warningTemperature
        ? "warning"
        : "normal";
}
export function supplySeverity(
  supply: SiteSupply,
  config: SiteMonitoringConfig,
): MonitoringSeverity | null {
  if (!supply.available) return null;
  const amount = new Prisma.Decimal(supply.remainingLiters);
  return amount.lte(config.criticalSupplyLiters)
    ? "critical"
    : amount.lte(config.lowSupplyLiters)
      ? "warning"
      : "normal";
}
export const highest = (
  a: MonitoringSeverity | null,
  b: MonitoringSeverity | null,
): MonitoringSeverity =>
  a === "critical" || b === "critical"
    ? "critical"
    : a === "warning" || b === "warning"
      ? "warning"
      : "normal";
export function monitoringDay(
  date: string,
  config: SiteMonitoringConfig | null,
  active: boolean,
  weather: SiteForecast,
  supply: SiteSupply,
): MonitoringDay {
  const usable = weather.status === "fresh" || weather.status === "stale";
  const temperature = usable
    ? (weather.forecast?.daily.find((d) => d.date === date)?.temperatureMax ??
      null)
    : null;
  const enabled = Boolean(config?.enabled && active);
  const temp =
    enabled && config ? temperatureSeverity(temperature, config) : null;
  const stock = enabled && config ? supplySeverity(supply, config) : null;
  const incomplete =
    temp === null || stock === null || weather.status !== "fresh";
  const severity = highest(temp, stock);
  return {
    date,
    temperature,
    temperatureSeverity: temp,
    supplySeverity: stock,
    status:
      severity !== "normal" ? severity : incomplete ? "unavailable" : "normal",
    incomplete,
  };
}
export function monitoringEvidence(
  day: MonitoringDay,
  config: SiteMonitoringConfig | null,
  weather: SiteForecast,
  supply: SiteSupply,
): MonitoringEvidence {
  return {
    temperature: day.temperature,
    availableLiters: supply.available ? supply.remainingLiters : null,
    warningTemperature: config?.warningTemperature ?? null,
    criticalTemperature: config?.criticalTemperature ?? null,
    lowSupplyLiters: config?.lowSupplyLiters ?? null,
    criticalSupplyLiters: config?.criticalSupplyLiters ?? null,
    configVersion: config?.version ?? 0,
    forecastUpdatedAt: weather.lastSuccessAt,
    supplyObservedAt: supply.observedAt,
  };
}
