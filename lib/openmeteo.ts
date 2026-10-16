import "server-only";
import { gridPoints, round, windToUV } from "./grid";
import { LAYERS } from "./layers";
import type { FieldId, GridForecast, GridSpec, PointForecast } from "./types";

const BASE_URL = process.env.OPEN_METEO_URL ?? "https://api.open-meteo.com/v1/forecast";
/** Model runs update every few hours; caching avoids burning the API quota. */
const REVALIDATE_SECONDS = 60 * 30;

interface OpenMeteoLocation {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  hourly: Record<string, number[]> & { time: number[] };
}

export class OpenMeteoError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

async function request(params: Record<string, string>): Promise<OpenMeteoLocation[]> {
  const url = `${BASE_URL}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { reason?: string } | null;
    throw new OpenMeteoError(body?.reason ?? `Open-Meteo respondeu ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoLocation | OpenMeteoLocation[];
  return Array.isArray(json) ? json : [json];
}

export async function fetchGridForecast(grid: GridSpec, forecastDays = 3): Promise<GridForecast> {
  const points = gridPoints(grid);
  const locations = await request({
    latitude: points.map((p) => p.lat).join(","),
    longitude: points.map((p) => p.lon).join(","),
    hourly: [...LAYERS.map((l) => l.variable), "wind_speed_10m", "wind_direction_10m"].join(","),
    wind_speed_unit: "ms",
    timeformat: "unixtime",
    timezone: "GMT",
    forecast_days: String(forecastDays),
  });
  if (locations.length !== points.length) {
    throw new OpenMeteoError("Resposta do Open-Meteo com número inesperado de pontos");
  }

  const times = locations[0].hourly.time;
  const fields = Object.fromEntries(LAYERS.map((l) => [l.id, [] as number[][]])) as Record<
    FieldId,
    number[][]
  >;
  const forecast: GridForecast = {
    grid,
    times,
    fields,
    windU: [],
    windV: [],
    generatedAt: new Date().toISOString(),
  };

  for (let t = 0; t < times.length; t++) {
    for (const layer of LAYERS) {
      fields[layer.id].push(
        locations.map((loc) => {
          const raw = loc.hourly[layer.variable]?.[t];
          if (raw == null) return layer.fallback;
          return round(layer.convert ? layer.convert(raw) : raw);
        }),
      );
    }
    const windU: number[] = [];
    const windV: number[] = [];
    for (const loc of locations) {
      const h = loc.hourly;
      const { u, v } = windToUV(h.wind_speed_10m[t] ?? 0, h.wind_direction_10m[t] ?? 0);
      windU.push(round(u, 2));
      windV.push(round(v, 2));
    }
    forecast.windU.push(windU);
    forecast.windV.push(windV);
  }
  return forecast;
}

export async function fetchPointForecast(lat: number, lon: number): Promise<PointForecast> {
  const [loc] = await request({
    latitude: String(round(lat, 3)),
    longitude: String(round(lon, 3)),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "weather_code",
    ].join(","),
    wind_speed_unit: "kmh",
    timeformat: "unixtime",
    timezone: "auto",
    forecast_days: "7",
  });
  const h = loc.hourly;
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    elevation: loc.elevation,
    timezone: loc.timezone,
    times: h.time,
    temperature: h.temperature_2m,
    apparentTemperature: h.apparent_temperature,
    precipitation: h.precipitation,
    precipitationProbability: h.precipitation_probability,
    windSpeed: h.wind_speed_10m,
    windGusts: h.wind_gusts_10m,
    windDirection: h.wind_direction_10m,
    weatherCode: h.weather_code,
  };
}
