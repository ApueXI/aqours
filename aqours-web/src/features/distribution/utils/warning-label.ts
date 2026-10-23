import type { MonitoringWarning } from '@aqours/contracts';
export function warningLabel(type: MonitoringWarning['type']) {
  return { high_temperature: 'High temperature', critical_temperature: 'Critical temperature', low_supply: 'Low supply', critical_supply: 'Critical supply', combined: 'High temperature and low supply' }[type];
}
