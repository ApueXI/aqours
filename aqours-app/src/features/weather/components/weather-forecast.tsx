import { View } from 'react-native';
import type { WeatherForecast } from '@aqours/contracts';
import { weatherCondition, weatherDayLabel, weatherMeasure } from '@aqours/contracts';
import { Body, Button, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime } from '@/utils/time';

export function WeatherForecastView({ path, location }: { path: string; location: string }) {
  const resource = useResource<WeatherForecast>(path);
  const forecast = resource.data;
  const current = forecast?.current;
  return <View style={{ gap: 12 }} accessibilityLiveRegion="polite">
    <Body>{location}</Body>
    <View style={styles.row}><Button title="Refresh weather" secondary disabled={resource.loading} onPress={() => void resource.reload()} /></View>
    <ResourceState {...resource} />
    {forecast && current && <>
      <Body>{weatherMeasure(current.temperature, '°C')} · {weatherCondition(current.weatherCode)}</Body>
      <Body>Feels like {weatherMeasure(current.feelsLike, '°C')} · Humidity {weatherMeasure(current.humidity, '%')}</Body>
      <Body>Precipitation {weatherMeasure(current.precipitation, 'mm')} · Wind {weatherMeasure(current.windSpeed, 'km/h')}</Body>
      <Body muted>Current model estimate: {displayTime(current.time)}</Body>
      <Body muted>Retrieved {displayTime(forecast.fetchedAt)} · Asia/Manila</Body>
      <Body>Seven-day forecast</Body>
      {forecast.daily.map(day => <View key={day.date} style={styles.item}>
        <Body>{weatherDayLabel(day.date)} · {weatherCondition(day.weatherCode)}</Body>
        <Body>Low {weatherMeasure(day.temperatureMin, '°C')} · High {weatherMeasure(day.temperatureMax, '°C')}</Body>
        <Body muted>Precipitation {weatherMeasure(day.precipitation, 'mm')} · Rain chance {weatherMeasure(day.rainProbability, '%')}</Body>
      </View>)}
    </>}
  </View>;
}
