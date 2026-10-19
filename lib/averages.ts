import type { TemperatureAverages } from "./types";

/**
 * Mean of daily max/min for the days within `window` days of month/day, across all
 * years in the series. Dates are "YYYY-MM-DD".
 */
export function averageForDate(
  dates: string[],
  max: (number | null)[],
  min: (number | null)[],
  month: number,
  day: number,
  window = 3,
): TemperatureAverages | null {
  const maxes: number[] = [];
  const mins: number[] = [];
  const years = new Set<number>();
  for (let i = 0; i < dates.length; i++) {
    const [y, m, d] = dates[i].split("-").map(Number);
    const target = Date.UTC(y, month - 1, day);
    const distance = Math.abs(Date.UTC(y, m - 1, d) - target) / 86_400_000;
    // Also compare against the target in the neighbouring year (late Dec / early Jan).
    const wrapped = Math.min(
      distance,
      Math.abs(Date.UTC(y, m - 1, d) - Date.UTC(y + 1, month - 1, day)) / 86_400_000,
      Math.abs(Date.UTC(y, m - 1, d) - Date.UTC(y - 1, month - 1, day)) / 86_400_000,
    );
    if (wrapped > window) continue;
    const hi = max[i];
    const lo = min[i];
    if (hi == null || lo == null) continue;
    maxes.push(hi);
    mins.push(lo);
    years.add(y);
  }
  if (maxes.length === 0) return null;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    years: years.size,
    max: Math.round(mean(maxes) * 10) / 10,
    min: Math.round(mean(mins) * 10) / 10,
  };
}
