import { describeWeather } from "./conditions";
import { formatHour } from "./format";
import { detectRisks } from "./risks";
import type { Forecast } from "./types";

/** What the user chose to be told about. Everything is off until they turn it on. */
export interface NotifySettings {
  /** "Vai chover em 1h": rain starting within the next `leadHours`. */
  rain: boolean;
  leadHours: 1 | 2 | 3;
  /** Severe risks only (level "alerta"): hail, very heavy rain, strong gusts… */
  severe: boolean;
}

export const DEFAULT_SETTINGS: NotifySettings = { rain: false, leadHours: 1, severe: false };

export interface WeatherNotice {
  /** Stable id: the same event is never notified twice. */
  tag: string;
  title: string;
  body: string;
}

const isRainCode = (code: number | null) =>
  code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95);

/** Light drizzle the model is unsure about is not worth a notification. */
function rainyHour(forecast: Forecast, i: number): boolean {
  const { precipitation, precipitationProbability, weatherCode } = forecast.hourly;
  const mm = precipitation[i];
  const chance = precipitationProbability[i];
  if (mm != null && mm >= 0.5) return chance == null || chance >= 40;
  return chance != null && chance >= 60 && isRainCode(weatherCode[i]);
}

function untilText(seconds: number): string {
  const minutes = Math.max(5, Math.round(seconds / 60 / 5) * 5);
  if (minutes < 50) return `em ~${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `em ~${hours}h`;
}

/**
 * Rain starting within `leadHours` of `now` (unix seconds), or null. Nothing is said when
 * it is already raining: the user knows.
 */
export function rainSoon(
  forecast: Forecast,
  place: { key: string; name: string },
  now: number,
  leadHours: number,
): WeatherNotice | null {
  const { hourly, current, timezone } = forecast;
  if ((current.precipitation ?? 0) >= 0.5 || isRainCode(current.weatherCode)) return null;

  for (let i = 0; i < hourly.time.length; i++) {
    const t = hourly.time[i];
    if (t + 3600 <= now) continue;
    if (t > now + leadHours * 3600) break;
    if (!rainyHour(forecast, i)) continue;
    // The hour under way already shows rain: it is starting now, not "in 1h".
    if (t <= now) return null;

    const label = describeWeather(hourly.weatherCode[i], hourly.isDay[i]).label;
    const kind = isRainCode(hourly.weatherCode[i]) ? label : "Chuva";
    const details = [
      hourly.precipitationProbability[i] != null &&
        `${hourly.precipitationProbability[i]}% de chance`,
      hourly.precipitation[i] != null &&
        `${hourly.precipitation[i]!.toFixed(1).replace(".", ",")} mm`,
    ].filter(Boolean);
    return {
      tag: `rain:${place.key}:${t}`,
      title: `Vai chover ${untilText(t - now)} · ${place.name}`,
      body: `${kind} por volta das ${formatHour(t, timezone)}${details.length ? ` (${details.join(", ")})` : ""}. Leve o guarda-chuva.`,
    };
  }
  return null;
}

/** Severe risks from the banner ("alerta" level), one notice each. */
export function severeNotices(
  forecast: Forecast,
  place: { key: string; name: string },
): WeatherNotice[] {
  return detectRisks(forecast)
    .filter((risk) => risk.level === "alerta")
    .map((risk) => ({
      tag: `risk:${place.key}:${risk.id}:${risk.time}`,
      title: `${risk.title} · ${place.name}`,
      body: risk.allDay
        ? risk.detail
        : `A partir das ${formatHour(risk.time, forecast.timezone)}. ${risk.detail}`,
    }));
}

/** After a rain notice, a forecast that shifts by an hour does not warrant another one. */
const RAIN_COOLDOWN = 3 * 3600;

/**
 * Everything the settings ask for that has not been sent yet. `sent` maps each tag already
 * notified to when (unix seconds).
 */
export function pendingNotices(
  forecast: Forecast,
  place: { key: string; name: string },
  settings: NotifySettings,
  now: number,
  sent: ReadonlyMap<string, number>,
): WeatherNotice[] {
  const notices: WeatherNotice[] = [];
  if (settings.rain) {
    const rain = rainSoon(forecast, place, now, settings.leadHours);
    const recent = [...sent].some(
      ([tag, at]) => tag.startsWith(`rain:${place.key}:`) && now - at < RAIN_COOLDOWN,
    );
    if (rain && !recent) notices.push(rain);
  }
  if (settings.severe) notices.push(...severeNotices(forecast, place));
  return notices.filter((n) => !sent.has(n.tag));
}
