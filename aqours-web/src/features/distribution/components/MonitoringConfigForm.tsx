import type { MonitoredSite, TemperatureBands } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { validateBands, validateMonitoring } from '../utils/monitoring-validation';
import { FormDialog } from '../../../components/FormDialog';

export function MonitoringConfigForm({ item, refresh }: { item: MonitoredSite; refresh: () => void }) {
  const config = item.config;
  return <FormDialog title={`Configure monitoring · ${item.site.name}`} triggerLabel={`Configure monitoring for ${item.site.name}`}>
    <p>Enable monitoring after reviewing this site’s thresholds. Supply limits have no suggested defaults.</p>
    <ActionForm key={`${item.site.id}:${config?.version || 0}`} path={`/staff/pickup-sites/${item.site.id}/monitoring`} method="PATCH"
      version={config?.version || 0} submit="Save monitoring configuration" onDone={refresh} validate={validateMonitoring} fields={[
        { name: 'enabled', label: 'Enable monitoring', type: 'checkbox', value: config?.enabled ?? false },
        { name: 'warningTemperature', label: 'Warning temperature (°C)', type: 'number', step: 'any', required: true, value: config?.warningTemperature ?? 35, hint: 'Suggested 35°C; daily maximum forecast.' },
        { name: 'criticalTemperature', label: 'Critical temperature (°C)', type: 'number', step: 'any', required: true, value: config?.criticalTemperature ?? 38, hint: 'Suggested 38°C; must exceed warning temperature.' },
        { name: 'lowSupplyLiters', label: 'Low supply threshold (L)', required: true, value: config?.lowSupplyLiters },
        { name: 'criticalSupplyLiters', label: 'Critical supply threshold (L)', required: true, value: config?.criticalSupplyLiters },
        { name: 'capacityLiters', label: 'Planning capacity (L, optional)', nullable: true, value: config?.capacityLiters, hint: 'Planning ratio only. Available liters may exceed 100% of capacity.' },
        { name: 'reason', label: 'Monitoring change reason', type: 'textarea', required: true },
      ]} />
  </FormDialog>;
}
export function TemperatureBandsForm({ bands, refresh }: { bands: TemperatureBands; refresh: () => void }) {
  return <FormDialog title="Temperature legend settings" triggerLabel="Temperature legend settings"><p>Legend colors describe daily maximum temperature. Site warning thresholds are configured separately.</p>
    <ActionForm key={bands.version} path="/staff/distribution/temperature-bands" method="PATCH" version={bands.version}
      submit="Save temperature legend" onDone={refresh} validate={validateBands} fields={[
        { name: 'boundaries', label: 'Temperature boundaries (°C, JSON)', type: 'json', required: true, value: JSON.stringify(bands.boundaries) },
        { name: 'reason', label: 'Legend change reason', type: 'textarea', required: true },
      ]} />
  </FormDialog>;
}
