import { present } from "./format";
import type { AirQuality } from "./types";

/** AQI of the hour starting at `time`, or null when the air quality model does not cover it. */
export function aqiAt(air: AirQuality | null, time: number): number | null {
  if (!air) return null;
  const i = air.hourly.time.indexOf(time);
  return i < 0 ? null : (air.hourly.aqi[i] ?? null);
}

/** Lowest and highest hourly AQI from `start` (inclusive) to `end` (exclusive). */
export function aqiRange(
  air: AirQuality | null,
  start: number,
  end: number,
): { min: number; max: number } | null {
  if (!air) return null;
  const values = present(
    air.hourly.aqi.filter((_, i) => air.hourly.time[i] >= start && air.hourly.time[i] < end),
  );
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : null;
}
