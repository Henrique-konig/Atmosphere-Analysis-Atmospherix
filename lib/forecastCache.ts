import { localeTag, t } from "./i18n";
import type { ForecastResponse } from "./types";

/** The last forecast loaded for a place, kept so the app still shows something offline. */
export interface CachedForecast {
  key: string;
  /** When it was fetched, in milliseconds. */
  savedAt: number;
  data: ForecastResponse;
}

const CACHE_KEY = "atmospherix:forecasts";
/** Each forecast is tens of kB; a handful of places is plenty and stays far from the quota. */
export const MAX_CACHED = 6;

export const forecastKey = (lat: number, lon: number) => `${lat.toFixed(3)},${lon.toFixed(3)}`;

/** Puts the entry first and drops older copies of the same place and the overflow. */
export function addEntry(
  entries: CachedForecast[],
  entry: CachedForecast,
  max = MAX_CACHED,
): CachedForecast[] {
  return [entry, ...entries.filter((e) => e.key !== entry.key)].slice(0, max);
}

function readAll(): CachedForecast[] {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CachedForecast[]) : [];
  } catch {
    return [];
  }
}

export function loadCachedForecast(key: string): CachedForecast | null {
  return readAll().find((e) => e.key === key && e.data?.forecast) ?? null;
}

export function storeCachedForecast(entry: CachedForecast) {
  const entries = addEntry(readAll(), entry);
  // Storage can be full or blocked: retry with just this place, then give up quietly.
  for (const list of [entries, [entry]]) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      return;
    } catch {
      /* try the smaller list */
    }
  }
}

const dayFormat = (timeZone?: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });

/** "14:32" today, "ontem, 14:32", or "19/10, 14:32", in the device's time zone. */
export function formatSavedAt(savedAt: number, now: number, timeZone?: string): string {
  const time = new Intl.DateTimeFormat(localeTag(), {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(savedAt);
  const day = dayFormat(timeZone);
  if (day.format(savedAt) === day.format(now)) return time;
  if (day.format(savedAt) === day.format(now - 86_400_000)) return t("offline.yesterday", { time });
  const date = new Intl.DateTimeFormat(localeTag(), {
    timeZone,
    day: "2-digit",
    month: "2-digit",
  }).format(savedAt);
  return `${date}, ${time}`;
}
