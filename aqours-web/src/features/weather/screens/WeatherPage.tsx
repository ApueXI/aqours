import { PageTitle } from '../../../components/Status';
import { WeatherPanel } from '../components/WeatherPanel';

export function WeatherPage() {
  return <div className="operations-page weather-page"><PageTitle title="Weather" /><p className="page-description">Current conditions and seven-day forecasts by city or municipality.</p><WeatherPanel /></div>;
}
