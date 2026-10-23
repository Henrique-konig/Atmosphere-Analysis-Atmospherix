import {
  convertDistance,
  convertPrecipitation,
  convertSpeed,
  convertTemp,
  distanceUnit,
  getUnits,
  precipitationUnit,
  speedUnit,
} from "./units";

const cache = new Map<string, Intl.DateTimeFormat>();

/** Intl formatters are costly to create; reuse one per time zone and pattern. */
function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = timeZone + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("pt-BR", { timeZone, ...options });
    cache.set(key, f);
  }
  return f;
}

/** "14h" in the location's time zone. */
export function formatHour(unix: number, timeZone: string): string {
  return `${formatter(timeZone, { hour: "2-digit", hourCycle: "h23" }).format(unix * 1000)}h`;
}

/** "06:12" in the location's time zone. */
export function formatTime(unix: number, timeZone: string): string {
  return formatter(timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    unix * 1000,
  );
}

/** "Seg", "Ter"… */
export function formatWeekday(unix: number, timeZone: string): string {
  const day = formatter(timeZone, { weekday: "short" })
    .format(unix * 1000)
    .replace(".", "");
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/** "19" */
export function formatDayOfMonth(unix: number, timeZone: string): string {
  return formatter(timeZone, { day: "numeric" }).format(unix * 1000);
}

/** "segunda-feira, 19 de outubro" */
export function formatLongDate(unix: number, timeZone: string): string {
  return formatter(timeZone, { weekday: "long", day: "numeric", month: "long" }).format(
    unix * 1000,
  );
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

const COMPASS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
export function compassPoint(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Shown in place of a value the model did not provide. */
export const MISSING = "—";

/** Temperature (°C in) in the chosen unit: "27°". */
export const formatTemp = (t: number | null) =>
  t == null ? MISSING : `${Math.round(convertTemp(t))}°`;

/** Just the number, for screen-reader labels ("27 graus"). */
export const formatTempNumber = (t: number | null) =>
  t == null ? MISSING : String(Math.round(convertTemp(t)));

/** Wind speed (km/h in), number only, in the chosen unit. */
export const formatSpeedNumber = (kmh: number | null) =>
  kmh == null ? MISSING : String(Math.round(convertSpeed(kmh)));

/** Wind speed (km/h in) with its unit: "12 km/h", "7 mph". */
export const formatSpeed = (kmh: number | null) =>
  kmh == null ? MISSING : `${Math.round(convertSpeed(kmh))} ${speedUnit()}`;

/** Visibility (km in), number only: one decimal below 10. */
export function formatDistanceNumber(km: number | null): string {
  if (km == null) return MISSING;
  const v = convertDistance(km);
  return formatNumber(v, v < 10 ? 1 : 0);
}

export { distanceUnit, precipitationUnit, speedUnit };

/** Rounded to `digits` decimals, or "—" when the value is missing. */
export const formatNumber = (v: number | null, digits = 0) =>
  v == null ? MISSING : digits > 0 ? v.toFixed(digits) : String(Math.round(v));

/** The values of a series that the model actually provided. */
export const present = (values: (number | null)[]) => values.filter((v): v is number => v != null);

/** Rain (mm in), number only, pt-BR style: "0", "0,4", "12" (or "0,02", "1,3" in inches). */
export function formatRain(mm: number | null): string {
  return mm == null ? MISSING : formatRainValue(convertPrecipitation(mm));
}

/** Like formatRain, for a value already in the chosen unit (chart series). */
export function formatRainValue(v: number): string {
  const inches = getUnits().precipitation === "in";
  if (v < (inches ? 0.005 : 0.05)) return "0";
  const decimals = inches ? (v < 1 ? 2 : 1) : v < 10 ? 1 : 0;
  return v.toFixed(decimals).replace(".", ",");
}

/** Rain (mm in) with its unit: "0,4 mm", "0,02 in". */
export const formatRainAmount = (mm: number | null) =>
  mm == null ? MISSING : `${formatRain(mm)} ${precipitationUnit()}`;
