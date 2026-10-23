function minorUnits(value: string) { const [whole, fraction = ''] = value.split('.'); return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')); }
export function validateMonitoring(body: Record<string, unknown>): string | undefined {
  const warning = body.warningTemperature, critical = body.criticalTemperature;
  if (typeof warning !== 'number' || typeof critical !== 'number' || !Number.isFinite(warning) || !Number.isFinite(critical) || critical <= warning) return 'Critical temperature must be higher than warning temperature.';
  const decimal = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
  const low = String(body.lowSupplyLiters ?? ''), urgent = String(body.criticalSupplyLiters ?? '');
  if (!decimal.test(low) || !decimal.test(urgent) || minorUnits(urgent) >= minorUnits(low)) return 'Supply thresholds require exact liters with 0 ≤ critical < low and at most two decimal places.';
  if (body.capacityLiters !== null && (!decimal.test(String(body.capacityLiters)) || minorUnits(String(body.capacityLiters)) <= 0n)) return 'Planning capacity must be positive liters or blank.';
}
export function validateBands(body: Record<string, unknown>): string | undefined {
  const bands = body.boundaries;
  if (!Array.isArray(bands) || bands.length !== 4 || bands.some((value, index) => typeof value !== 'number' || !Number.isFinite(value) || (index > 0 && value <= bands[index - 1]))) {
    return 'Enter exactly four increasing numeric temperature boundaries, for example [25,30,34,37].';
  }
}
