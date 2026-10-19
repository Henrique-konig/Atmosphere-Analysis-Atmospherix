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

/** Values the model did not provide are null and shown as "—", never as 0. */
export interface CurrentConditions {
  time: number;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  dewPoint: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  isDay: boolean;
  cloudCover: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGusts: number | null;
  visibility: number | null;
  uvIndex: number | null;
}

export interface HourlyForecast {
  time: number[];
  temperature: (number | null)[];
  apparentTemperature: (number | null)[];
  humidity: (number | null)[];
  dewPoint: (number | null)[];
  precipitationProbability: (number | null)[];
  precipitation: (number | null)[];
  weatherCode: (number | null)[];
  pressure: (number | null)[];
  visibility: (number | null)[];
  windSpeed: (number | null)[];
  windDirection: (number | null)[];
  windGusts: (number | null)[];
  uvIndex: (number | null)[];
  isDay: boolean[];
}

export interface DailyForecast {
  time: number[];
  weatherCode: (number | null)[];
  temperatureMax: (number | null)[];
  temperatureMin: (number | null)[];
  sunrise: (number | null)[];
  sunset: (number | null)[];
  daylightDuration: (number | null)[];
  uvIndexMax: (number | null)[];
  precipitationSum: (number | null)[];
  precipitationProbabilityMax: (number | null)[];
  windSpeedMax: (number | null)[];
  windGustsMax: (number | null)[];
  windDirectionDominant: (number | null)[];
}

export interface Forecast {
  latitude: number;
  longitude: number;
  elevation: number;
  /** IANA time zone of the location, used to show local times. */
  timezone: string;
  current: CurrentConditions;
  /** From the current hour, for the next 48 hours. */
  hourly: HourlyForecast;
  /** Every hour of the forecast days, from local midnight today: the day details. */
  dayHours: HourlyForecast;
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

/** What the city list shows for each saved place. */
export interface PlaceSummary {
  time: number;
  timezone: string;
  temperature: number | null;
  weatherCode: number | null;
  isDay: boolean;
  max: number | null;
  min: number | null;
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
