export interface BBox {
  north: number;
  south: number;
  west: number;
  east: number;
}

/** Regular lat/lon grid, row-major from north-west to south-east. */
export interface GridSpec {
  bbox: BBox;
  nx: number;
  ny: number;
}

/** Hourly precipitation (mm/h) over a grid, used by the rain map. */
export interface PrecipitationGrid {
  grid: GridSpec;
  /** Unix timestamps (seconds, UTC) for each forecast step. */
  times: number[];
  /** Per time step, a flat array of nx * ny values. */
  precipitation: number[][];
}

export interface CurrentConditions {
  time: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  visibility: number;
  uvIndex: number;
}

export interface HourlyForecast {
  time: number[];
  temperature: number[];
  apparentTemperature: number[];
  humidity: number[];
  dewPoint: number[];
  precipitationProbability: number[];
  precipitation: number[];
  weatherCode: number[];
  pressure: number[];
  visibility: number[];
  windSpeed: number[];
  windDirection: number[];
  windGusts: number[];
  uvIndex: number[];
  isDay: boolean[];
}

export interface DailyForecast {
  time: number[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  sunrise: number[];
  sunset: number[];
  daylightDuration: number[];
  uvIndexMax: number[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  windDirectionDominant: number[];
}

export interface Forecast {
  latitude: number;
  longitude: number;
  elevation: number;
  /** IANA time zone of the location, used to show local times. */
  timezone: string;
  current: CurrentConditions;
  hourly: HourlyForecast;
  daily: DailyForecast;
}

/** Typical temperatures for today's date, from past years. */
export interface TemperatureAverages {
  years: number;
  max: number;
  min: number;
}

export interface ForecastResponse {
  forecast: Forecast;
  averages: TemperatureAverages | null;
}

export interface Place {
  id: number;
  name: string;
  /** State / province, when known. */
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}
