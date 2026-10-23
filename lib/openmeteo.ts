import "server-only";
import { gridPoints, round } from "./grid";
import { averageForDate } from "./averages";
import type {
  AirQuality,
  CurrentConditions,
  DailyForecast,
  Forecast,
  GridSpec,
  HourlyForecast,
  PlaceSummary,
  PrecipitationGrid,
  TemperatureAverages,
} from "./types";

const FORECAST_URL = process.env.OPEN_METEO_URL ?? "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL =
  process.env.OPEN_METEO_ARCHIVE_URL ?? "https://archive-api.open-meteo.com/v1/archive";
const AIR_QUALITY_URL =
  process.env.OPEN_METEO_AIR_QUALITY_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality";

/** Model runs update every few hours; caching avoids burning the API quota. */
const FORECAST_REVALIDATE = 60 * 15;
/** Past weather does not change. */
const ARCHIVE_REVALIDATE = 60 * 60 * 24;

/** Hours shown in the hourly strip and scanned for risks. */
export const HOURS_AHEAD = 48;
/** Hours of the rain map timeline (now + 12h). */
export const RAIN_MAP_HOURS = 13;

type Series = Record<string, (number | null)[]>;

interface OpenMeteoLocation {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current?: Record<string, number | null> & { time: number };
  hourly?: Series & { time: number[] };
  daily?: Series & { time: number[] };
}

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

async function request<T>(base: string, params: Record<string, string>, revalidate: number) {
  const res = await fetch(`${base}?${new URLSearchParams(params)}`, { next: { revalidate } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { reason?: string } | null;
    throw new OpenMeteoError(body?.reason ?? `Open-Meteo respondeu ${res.status}`);
  }
  return (await res.json()) as T;
}

const HOURLY_VARS = {
  temperature: "temperature_2m",
  apparentTemperature: "apparent_temperature",
  humidity: "relative_humidity_2m",
  dewPoint: "dew_point_2m",
  precipitationProbability: "precipitation_probability",
  precipitation: "precipitation",
  weatherCode: "weather_code",
  pressure: "pressure_msl",
  visibility: "visibility",
  windSpeed: "wind_speed_10m",
  windDirection: "wind_direction_10m",
  windGusts: "wind_gusts_10m",
  uvIndex: "uv_index",
  isDay: "is_day",
} as const;

const DAILY_VARS = {
  weatherCode: "weather_code",
  temperatureMax: "temperature_2m_max",
  temperatureMin: "temperature_2m_min",
  sunrise: "sunrise",
  sunset: "sunset",
  daylightDuration: "daylight_duration",
  uvIndexMax: "uv_index_max",
  precipitationSum: "precipitation_sum",
  precipitationProbabilityMax: "precipitation_probability_max",
  windSpeedMax: "wind_speed_10m_max",
  windGustsMax: "wind_gusts_10m_max",
  windDirectionDominant: "wind_direction_10m_dominant",
} as const;

const CURRENT_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "precipitation",
  "weather_code",
  "is_day",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
];

/** Missing values stay null: the UI shows them as unavailable instead of a fake 0. */
function column(series: Series, name: string, from = 0, to?: number): (number | null)[] {
  return (series[name] ?? []).slice(from, to).map((v) => v ?? null);
}

/** Index of the hour that contains `now` (the last step not after it). */
export function currentHourIndex(times: number[], now: number): number {
  let index = 0;
  for (let i = 0; i < times.length; i++) if (times[i] <= now) index = i;
  return index;
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const loc = await request<OpenMeteoLocation>(
    FORECAST_URL,
    {
      latitude: String(round(lat, 3)),
      longitude: String(round(lon, 3)),
      current: CURRENT_VARS.join(","),
      hourly: Object.values(HOURLY_VARS).join(","),
      daily: Object.values(DAILY_VARS).join(","),
      wind_speed_unit: "kmh",
      timeformat: "unixtime",
      timezone: "auto",
      forecast_days: "10",
    },
    FORECAST_REVALIDATE,
  );
  if (!loc.current || !loc.hourly || !loc.daily) {
    throw new OpenMeteoError("Resposta incompleta do Open-Meteo");
  }

  const c = loc.current;
  const start = currentHourIndex(loc.hourly.time, c.time);
  const hourly = hourlySlice(loc.hourly, start, start + HOURS_AHEAD);
  const dayHours = hourlySlice(loc.hourly, 0);

  const daily = Object.fromEntries(
    Object.entries(DAILY_VARS).map(([key, name]) => [key, column(loc.daily!, name)]),
  ) as unknown as DailyForecast;
  daily.time = loc.daily.time;

  const current: CurrentConditions = {
    time: c.time,
    temperature: c.temperature_2m ?? null,
    apparentTemperature: c.apparent_temperature ?? null,
    humidity: c.relative_humidity_2m ?? null,
    precipitation: c.precipitation ?? null,
    weatherCode: c.weather_code ?? null,
    isDay: Boolean(c.is_day),
    cloudCover: c.cloud_cover ?? null,
    pressure: c.pressure_msl ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    windDirection: c.wind_direction_10m ?? null,
    windGusts: c.wind_gusts_10m ?? null,
    // Not part of the "current" block: take them from the current hour.
    dewPoint: hourly.dewPoint[0] ?? null,
    visibility: hourly.visibility[0] ?? null,
    uvIndex: hourly.uvIndex[0] ?? null,
  };

  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    elevation: loc.elevation,
    timezone: loc.timezone,
    current,
    hourly,
    dayHours,
    daily,
  };
}

function hourlySlice(series: Series & { time: number[] }, from: number, to?: number) {
  const hourly = Object.fromEntries(
    Object.entries(HOURLY_VARS).map(([key, name]) => [key, column(series, name, from, to)]),
  ) as unknown as HourlyForecast;
  hourly.time = series.time.slice(from, to);
  hourly.isDay = hourly.isDay.map(Boolean);
  return hourly;
}

/** Current US AQI and pollutants, plus the hourly AQI for the forecast days the model covers. */
export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
  const loc = await request<OpenMeteoLocation>(
    AIR_QUALITY_URL,
    {
      latitude: String(round(lat, 2)),
      longitude: String(round(lon, 2)),
      current: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
      hourly: "us_aqi",
      timeformat: "unixtime",
      timezone: "auto",
      forecast_days: "5",
    },
    FORECAST_REVALIDATE,
  );
  if (!loc.current || !loc.hourly) return null;
  const c = loc.current;
  return {
    current: {
      time: c.time,
      aqi: c.us_aqi ?? null,
      pm25: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      ozone: c.ozone ?? null,
      nitrogenDioxide: c.nitrogen_dioxide ?? null,
    },
    hourly: { time: loc.hourly.time, aqi: column(loc.hourly, "us_aqi") },
  };
}

/** Most places one city-list request may ask for. */
export const MAX_SUMMARIES = 20;

/** Current temperature, condition and today's range for several places in one request. */
export async function fetchSummaries(
  points: { lat: number; lon: number }[],
): Promise<PlaceSummary[]> {
  const json = await request<OpenMeteoLocation | OpenMeteoLocation[]>(
    FORECAST_URL,
    {
      latitude: points.map((p) => String(round(p.lat, 3))).join(","),
      longitude: points.map((p) => String(round(p.lon, 3))).join(","),
      current: "temperature_2m,weather_code,is_day",
      daily: "temperature_2m_max,temperature_2m_min",
      timeformat: "unixtime",
      timezone: "auto",
      forecast_days: "1",
    },
    FORECAST_REVALIDATE,
  );
  const locations = Array.isArray(json) ? json : [json];
  if (locations.length !== points.length) {
    throw new OpenMeteoError("Resposta do Open-Meteo com número inesperado de pontos");
  }
  return locations.map((loc) => ({
    time: loc.current?.time ?? 0,
    timezone: loc.timezone,
    temperature: loc.current?.temperature_2m ?? null,
    weatherCode: loc.current?.weather_code ?? null,
    isDay: Boolean(loc.current?.is_day ?? 1),
    max: loc.daily?.temperature_2m_max?.[0] ?? null,
    min: loc.daily?.temperature_2m_min?.[0] ?? null,
  }));
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Typical max/min for today's date over the last 10 years (±3 days), from the
 * historical weather archive. One small request per year: the archive bills by the
 * length of the period, so ten 7-day windows cost far less than a 10-year range.
 */
export async function fetchTemperatureAverages(
  lat: number,
  lon: number,
  today = new Date(),
): Promise<TemperatureAverages | null> {
  const years = Array.from({ length: 10 }, (_, i) => today.getUTCFullYear() - 1 - i);
  const windows = await Promise.allSettled(
    years.map((year) => {
      const centre = Date.UTC(year, today.getUTCMonth(), today.getUTCDate());
      return request<{ daily?: { time: string[] } & Series }>(
        ARCHIVE_URL,
        {
          // Rounded so nearby places share the cached responses.
          latitude: String(round(lat, 1)),
          longitude: String(round(lon, 1)),
          start_date: isoDate(new Date(centre - 3 * 86_400_000)),
          end_date: isoDate(new Date(centre + 3 * 86_400_000)),
          daily: "temperature_2m_max,temperature_2m_min",
          timezone: "auto",
        },
        ARCHIVE_REVALIDATE,
      );
    }),
  );

  const dates: string[] = [];
  const max: (number | null)[] = [];
  const min: (number | null)[] = [];
  for (const w of windows) {
    if (w.status !== "fulfilled" || !w.value.daily) continue;
    dates.push(...w.value.daily.time);
    max.push(...(w.value.daily.temperature_2m_max ?? []));
    min.push(...(w.value.daily.temperature_2m_min ?? []));
  }
  return averageForDate(dates, max, min, today.getUTCMonth() + 1, today.getUTCDate());
}

/** Hourly precipitation over a grid for the rain map, from the current hour onwards. */
export async function fetchPrecipitationGrid(
  grid: GridSpec,
  now = Date.now() / 1000,
): Promise<PrecipitationGrid> {
  const points = gridPoints(grid);
  const json = await request<OpenMeteoLocation | OpenMeteoLocation[]>(
    FORECAST_URL,
    {
      latitude: points.map((p) => p.lat).join(","),
      longitude: points.map((p) => p.lon).join(","),
      hourly: "precipitation",
      timeformat: "unixtime",
      timezone: "GMT",
      forecast_days: "2",
    },
    FORECAST_REVALIDATE,
  );
  const locations = Array.isArray(json) ? json : [json];
  if (locations.length !== points.length || !locations[0].hourly) {
    throw new OpenMeteoError("Resposta do Open-Meteo com número inesperado de pontos");
  }

  const allTimes = locations[0].hourly.time;
  const start = currentHourIndex(allTimes, now);
  const times = allTimes.slice(start, start + RAIN_MAP_HOURS);
  const precipitation = times.map((_, i) =>
    locations.map((loc) => round(loc.hourly?.precipitation?.[start + i] ?? 0)),
  );
  return { grid, times, precipitation };
}
