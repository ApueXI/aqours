import { useEffect, useState } from 'react';
import { distributionMapStyles } from '../utils/distribution-basemap';
import { temperatureColors, type MapStyle } from '../utils/distribution-state';
export function MonitoringMapControls({ style, temperature, bands, change }: {
  style: MapStyle; temperature: boolean; bands: number[]; change: (values: Record<string, string>) => void;
}) {
  const [temperatureChecked, setTemperatureChecked] = useState(temperature);
  useEffect(() => setTemperatureChecked(temperature), [temperature]);
  const styles = distributionMapStyles({ apiKey: import.meta.env.VITE_GEOAPIFY_MAPS_API_KEY, tileUrl: import.meta.env.VITE_MAP_TILE_URL });
  const labels = [`Below ${bands[0]}°C`, ...bands.slice(0, -1).map((value, index) => `${value} to below ${bands[index + 1]}°C`), `${bands[3]}°C and above`];
  return <><div className="distribution-map-controls"><label className="field"><span>Map style</span><select aria-label="Map style" disabled={styles.length < 2} value={styles.length < 2 ? 'streets' : style} onChange={event => change({ style: event.target.value })}>
    {styles.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label className="check-field"><input type="checkbox" checked={temperatureChecked} onChange={event => {
      const checked = event.target.checked; setTemperatureChecked(checked); change({ temperature: checked ? '1' : '0' });
    }} />Daily maximum temperature overlay</label>
  </div><div className="distribution-legend" aria-label="Distribution map legend"><p>Site status: <span className="status-key normal">Green — Normal</span> · <span className="status-key warning">Yellow — Warning</span> · <span className="status-key critical">Red — Critical</span> · <span className="status-key unavailable">Gray — Unavailable</span></p>
    {temperatureChecked && <><p>Site daily maximum temperature (°C)</p><ul>{labels.map((text, index) => <li key={text}><span className="temperature-swatch" style={{ background: temperatureColors[index] }} />{text}</li>)}</ul><p>Circles represent individual sites. Retained stale values are labeled. No regional surface or interpolation.</p></>}
  </div></>;
}
