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

export const formatTemp = (t: number | null) => (t == null ? MISSING : `${Math.round(t)}°`);

/** Rounded to `digits` decimals, or "—" when the value is missing. */
export const formatNumber = (v: number | null, digits = 0) =>
  v == null ? MISSING : digits > 0 ? v.toFixed(digits) : String(Math.round(v));

/** The values of a series that the model actually provided. */
export const present = (values: (number | null)[]) => values.filter((v): v is number => v != null);
