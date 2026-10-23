import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  SiteMonitoringConfig,
  SiteSupply,
  SiteForecast,
} from "@aqours/contracts";
import { monitoringDates } from "../src/services/monitoring/context.js";
import {
  monitoringDay,
  supplySeverity,
  temperatureSeverity,
} from "../src/services/monitoring/evidence.js";
import {
  monitoringConfigInput,
  bandsInput,
} from "../src/services/monitoring/settings.js";
import { normalizeForecast } from "../src/services/weather/normalize.js";
import { weatherFixture } from "./weather-fixture.js";
const config: SiteMonitoringConfig = {
  siteId: "s",
  supplierId: "p",
  version: 1,
  enabled: true,
  warningTemperature: 35,
  criticalTemperature: 38,
  lowSupplyLiters: "100.10",
  criticalSupplyLiters: "0.00",
  capacityLiters: "1000.00",
  updatedAt: "",
};
const supply: SiteSupply = {
  available: true,
  sessionIds: ["s"],
  sessionCount: 1,
  totalLiters: "1000.00",
  reservedLiters: "0.00",
  collectedLiters: "0.00",
  remainingLiters: "100.10",
  observedAt: "",
  capacityPercentage: 10.01,
};
const weather: SiteForecast = {
  status: "fresh",
  forecast: normalizeForecast(weatherFixture(), 14, 121),
  lastAttemptAt: null,
  lastSuccessAt: null,
  nextRefreshAt: null,
  error: null,
};
test("monitoring temperature and exact decimal supply include threshold equality", () => {
  assert.equal(temperatureSeverity(34.99, config), "normal");
  assert.equal(temperatureSeverity(35, config), "warning");
  assert.equal(temperatureSeverity(38, config), "critical");
  assert.equal(temperatureSeverity(null, config), null);
  assert.equal(supplySeverity(supply, config), "warning");
  assert.equal(
    supplySeverity({ ...supply, remainingLiters: "100.11" }, config),
    "normal",
  );
  assert.equal(
    supplySeverity({ ...supply, remainingLiters: "0.00" }, config),
    "critical",
  );
  assert.equal(supplySeverity({ ...supply, available: false }, config), null);
});
test("monitoring Manila seven dates crosses month and year without UTC day leakage", () => {
  assert.deepEqual(monitoringDates(new Date("2026-12-31T16:00:00Z")), [
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
    "2027-01-04",
    "2027-01-05",
    "2027-01-06",
    "2027-01-07",
  ]);
  assert.equal(
    monitoringDates(new Date("2026-10-21T15:59:59Z"))[0],
    "2026-10-21",
  );
});
test("monitoring unknown/stale temperature is incomplete while supply risk stays visible", () => {
  const normalSupply = { ...supply, remainingLiters: "1000.00" };
  assert.equal(
    monitoringDay(
      "2026-10-21",
      config,
      true,
      { ...weather, status: "unavailable" },
      normalSupply,
    ).status,
    "unavailable",
  );
  assert.equal(
    monitoringDay(
      "2026-10-21",
      config,
      true,
      { ...weather, status: "unavailable" },
      supply,
    ).status,
    "warning",
  );
  assert.equal(
    monitoringDay("2026-10-21", null, true, weather, supply).status,
    "unavailable",
  );
  assert.equal(
    monitoringDay(
      "2026-10-21",
      { ...config, enabled: false },
      true,
      weather,
      supply,
    ).status,
    "unavailable",
  );
  assert.equal(
    monitoringDay("2026-10-21", config, false, weather, supply).status,
    "unavailable",
  );
  assert.equal(
    monitoringDay(
      "2026-10-21",
      config,
      true,
      { ...weather, status: "stale" },
      normalSupply,
    ).incomplete,
    true,
  );
});
test("monitoring setup rejects equal boundaries, zero capacity and numeric coercion", () => {
  const input = {
    expectedVersion: 0,
    enabled: true,
    warningTemperature: 35,
    criticalTemperature: 38,
    lowSupplyLiters: "100.10",
    criticalSupplyLiters: "0",
    capacityLiters: null,
    reason: "Setup",
  };
  assert.equal(monitoringConfigInput.safeParse(input).success, true);
  for (const patch of [
    { criticalTemperature: 35 },
    { lowSupplyLiters: "0" },
    { criticalSupplyLiters: "-1" },
    { capacityLiters: "0" },
    { warningTemperature: "35" },
    { criticalTemperature: Infinity },
  ])
    assert.equal(
      monitoringConfigInput.safeParse({ ...input, ...patch }).success,
      false,
    );
  assert.equal(
    bandsInput.safeParse({
      expectedVersion: 0,
      boundaries: [25, 30, 34, 37],
      reason: "Setup",
    }).success,
    true,
  );
  for (const boundaries of [
    [25, 25, 34, 37],
    [25, 30, 34],
    [25, 30, 34, Infinity],
    [30, 25, 34, 37],
  ])
    assert.equal(
      bandsInput.safeParse({ expectedVersion: 0, boundaries, reason: "Setup" })
        .success,
      false,
    );
});
