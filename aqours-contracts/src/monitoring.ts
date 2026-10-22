import type { PickupSite } from './services.js';
import type { WeatherForecast } from './weather.js';

export type MonitoringSeverity = 'normal' | 'warning' | 'critical';
export type MonitoringStatus = MonitoringSeverity | 'unavailable';
export interface SiteMonitoringConfig {
  siteId: string; supplierId: string; version: number; enabled: boolean;
  warningTemperature: number; criticalTemperature: number;
  lowSupplyLiters: string; criticalSupplyLiters: string; capacityLiters: string | null;
  updatedAt: string;
}
export interface SiteForecast {
  status: 'fresh' | 'stale' | 'unavailable' | 'missing' | 'unlocated';
  forecast: WeatherForecast | null; lastAttemptAt: string | null;
  lastSuccessAt: string | null; nextRefreshAt: string | null; error: string | null;
}
export interface SiteSupply {
  available: boolean; sessionIds: string[]; sessionCount: number;
  totalLiters: string; reservedLiters: string; collectedLiters: string;
  remainingLiters: string; observedAt: string; capacityPercentage: number | null;
}
export interface MonitoringEvidence {
  temperature: number | null; availableLiters: string | null;
  warningTemperature: number | null; criticalTemperature: number | null;
  lowSupplyLiters: string | null; criticalSupplyLiters: string | null;
  configVersion: number; forecastUpdatedAt: string | null; supplyObservedAt: string;
}
export interface MonitoringWarning {
  id: string; supplierId: string; siteId: string; siteName: string;
  family: 'temperature' | 'supply' | 'combined'; forecastDate: string;
  type: 'high_temperature' | 'critical_temperature' | 'low_supply' | 'critical_supply' | 'combined';
  severity: 'warning' | 'critical'; state: 'active' | 'resolved' | 'expired' | 'suspended';
  evidence: MonitoringEvidence; createdAt: string; updatedAt: string;
  closedReason: string | null; revision: number;
}
export interface MonitoringWarningHistory {
  id: string; warningId: string; revision: number; action: string;
  severity: 'warning' | 'critical'; state: MonitoringWarning['state'];
  evidence: MonitoringEvidence; createdAt: string; reason: string | null;
}
export interface MonitoringDay {
  date: string; temperature: number | null;
  temperatureSeverity: MonitoringSeverity | null; supplySeverity: MonitoringSeverity | null;
  status: MonitoringStatus; incomplete: boolean;
}
export interface MonitoredSite {
  site: PickupSite; config: SiteMonitoringConfig | null; weather: SiteForecast;
  supply: SiteSupply; warnings: MonitoringWarning[]; days: MonitoringDay[];
}
export interface TemperatureBands { version: number; boundaries: number[] }
export interface MonitoringOverview {
  supplier: { id: string; name: string }; asOf: string; dates: string[];
  sites: MonitoredSite[]; temperatureBands: TemperatureBands;
}
export interface SupplierMonitoringNotification {
  id: string; siteId: string; title: string; text: string;
  createdAt: string; readAt: string | null;
}
