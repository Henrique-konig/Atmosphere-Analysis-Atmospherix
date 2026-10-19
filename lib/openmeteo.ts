import "server-only";
import { gridPoints, round } from "./grid";
import { averageForDate } from "./averages";
import type {
  CurrentConditions,
  DailyForecast,
  Forecast,
  GridSpec,
  HourlyForecast,
  PrecipitationGrid,
  TemperatureAverages,
} from "./types";

const FORECAST_URL = process.env.OPEN_METEO_URL ?? "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL =
  process.env.OPEN_METEO_ARCHIVE_URL ?? "https://archive-api.open-meteo.com/v1/archive";

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
  current?: Record<string, number>;
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

/** Missing values (null) become 0 so the UI never has to special-case them. */
function column(series: Series, name: string, from = 0, to?: number): number[] {
  return (series[name] ?? []).slice(from, to).map((v) => v ?? 0);
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
  const end = start + HOURS_AHEAD;
  const hourlyColumn = (name: string) => column(loc.hourly!, name, start, end);

  const hourly = Object.fromEntries(
    Object.entries(HOURLY_VARS).map(([key, name]) => [key, hourlyColumn(name)]),
  ) as unknown as HourlyForecast;
  hourly.time = loc.hourly.time.slice(start, end);
  hourly.isDay = hourlyColumn("is_day").map(Boolean);

  const daily = Object.fromEntries(
    Object.entries(DAILY_VARS).map(([key, name]) => [key, column(loc.daily!, name)]),
  ) as unknown as DailyForecast;
  daily.time = loc.daily.time;

  const current: CurrentConditions = {
    time: c.time,
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    isDay: Boolean(c.is_day),
    cloudCover: c.cloud_cover,
    pressure: c.pressure_msl,
    windSpeed: c.wind_speed_10m,
    windDirection: c.wind_direction_10m,
    windGusts: c.wind_gusts_10m,
    // Not part of the "current" block: take them from the current hour.
    dewPoint: hourly.dewPoint[0] ?? 0,
    visibility: hourly.visibility[0] ?? 0,
    uvIndex: hourly.uvIndex[0] ?? 0,
  };

  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    elevation: loc.elevation,
    timezone: loc.timezone,
    current,
    hourly,
    daily,
  };
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
