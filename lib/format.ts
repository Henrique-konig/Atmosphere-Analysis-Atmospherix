import { getLocale, localeTag, t, type MessageKey } from "./i18n";
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

/** Intl formatters are costly to create; reuse one per language, time zone and pattern. */
function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = localeTag();
  const key = tag + timeZone + JSON.stringify(options);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, { timeZone, ...options });
    cache.set(key, f);
  }
  return f;
}

/** "14h" in the location's time zone ("14 h" in Spanish, "2 PM" in English). */
export function formatHour(unix: number, timeZone: string): string {
  if (getLocale() === "en")
    return formatter(timeZone, { hour: "numeric", hour12: true }).format(unix * 1000);
  const hour = formatter(timeZone, { hour: "2-digit", hourCycle: "h23" }).format(unix * 1000);
  return getLocale() === "es" ? `${hour} h` : `${hour}h`;
}

/** Local hour of a timestamp, 0–23, whatever the language's clock format. */
export function localHour(unix: number, timeZone: string): number {
  return Number(formatter(timeZone, { hour: "2-digit", hourCycle: "h23" }).format(unix * 1000));
}

/** Decimal number with the language's decimal mark: "0,5" ("0.5" in English). */
export const formatDecimal = (v: number, digits: number) => {
  const text = v.toFixed(digits);
  return getLocale() === "en" ? text : text.replace(".", ",");
};

/** "06:12" in the location's time zone ("6:12 AM" in English). */
export function formatTime(unix: number, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions =
    getLocale() === "en"
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" };
  return formatter(timeZone, options).format(unix * 1000);
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

const COMPASS: MessageKey[] = [
  "compass.N",
  "compass.NE",
  "compass.E",
  "compass.SE",
  "compass.S",
  "compass.SW",
  "compass.W",
  "compass.NW",
];
export function compassPoint(deg: number): string {
  return t(COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]);
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

/** Rain (mm in), number only, with the language's decimal mark: "0", "0,4", "12" ("0.4" in English). */
export function formatRain(mm: number | null): string {
  return mm == null ? MISSING : formatRainValue(convertPrecipitation(mm));
}

/** Like formatRain, for a value already in the chosen unit (chart series). */
export function formatRainValue(v: number): string {
  const inches = getUnits().precipitation === "in";
  if (v < (inches ? 0.005 : 0.05)) return "0";
  const decimals = inches ? (v < 1 ? 2 : 1) : v < 10 ? 1 : 0;
  const text = v.toFixed(decimals);
  return getLocale() === "en" ? text : text.replace(".", ",");
}

/** Rain (mm in) with its unit: "0,4 mm", "0,02 in". */
export const formatRainAmount = (mm: number | null) =>
  mm == null ? MISSING : `${formatRain(mm)} ${precipitationUnit()}`;
