import { formatHour, formatWeekday, present } from "./format";
import type { Forecast } from "./types";

export type RiskLevel = "atenção" | "alerta";

export interface Risk {
  id: string;
  level: RiskLevel;
  title: string;
  detail: string;
  /** Unix time when the condition starts (first matching hour or day). */
  time: number;
  /** Based on a whole day's value (max temperature, UV…) rather than an hour. */
  allDay?: boolean;
}

/**
 * Risks inferred from the forecast for the next 48 hours (and today/tomorrow's daily
 * values). These are not official civil-defence alerts.
 */
export function detectRisks(forecast: Forecast): Risk[] {
  const { hourly, daily } = forecast;
  // A missing value never triggers a risk.
  const atLeast = (v: number | null, limit: number) => v != null && v >= limit;
  const atMost = (v: number | null, limit: number) => v != null && v <= limit;
  const risks: Risk[] = [];
  const firstHour = (test: (i: number) => boolean) => hourly.time.findIndex((_, i) => test(i));

  const storm = firstHour((i) => atLeast(hourly.weatherCode[i], 95));
  if (storm >= 0) {
    const stormHours = hourly.time.flatMap((_, i) =>
      atLeast(hourly.weatherCode[i], 95) ? [i] : [],
    );
    const hail = stormHours.some(
      (i) => hourly.weatherCode[i] === 96 || hourly.weatherCode[i] === 99,
    );
    const stormGust = Math.max(0, ...present(stormHours.map((i) => hourly.windGusts[i])));
    const windy = stormGust >= 60;
    risks.push({
      id: "storm",
      level: hail || windy ? "alerta" : "atenção",
      title: hail ? "Tempestade com granizo" : windy ? "Tempestade com ventania" : "Tempestades",
      detail: windy
        ? `Trovoadas com rajadas de até ${Math.round(stormGust)} km/h. Fique em local fechado e longe de árvores.`
        : "Trovoadas previstas. Evite áreas abertas e fique longe de árvores.",
      time: hourly.time[storm],
    });
  }

  const maxRainHour = Math.max(0, ...present(hourly.precipitation));
  const heavyHour = firstHour((i) => atLeast(hourly.precipitation[i], 10));
  const heavyDay = daily.precipitationSum.slice(0, 2).findIndex((mm) => atLeast(mm, 50));
  if (heavyHour >= 0 || heavyDay >= 0) {
    const severe =
      maxRainHour >= 25 || daily.precipitationSum.slice(0, 2).some((mm) => atLeast(mm, 80));
    risks.push({
      id: "rain",
      level: severe ? "alerta" : "atenção",
      title: "Chuva forte",
      detail:
        heavyHour >= 0
          ? `Até ${Math.round(maxRainHour)} mm em uma hora. Risco de alagamentos.`
          : `Acumulado de ${Math.round(daily.precipitationSum[heavyDay] ?? 0)} mm no dia. Risco de alagamentos.`,
      time: heavyHour >= 0 ? hourly.time[heavyHour] : daily.time[heavyDay],
      allDay: heavyHour < 0,
    });
  }

  const maxGust = Math.max(0, ...present(hourly.windGusts));
  const gust = firstHour((i) => atLeast(hourly.windGusts[i], 60));
  if (gust >= 0) {
    risks.push({
      id: "wind",
      level: maxGust >= 80 ? "alerta" : "atenção",
      title: maxGust >= 80 ? "Rajadas muito fortes" : "Rajadas fortes",
      detail: `Rajadas de até ${Math.round(maxGust)} km/h. Cuidado com objetos soltos e árvores.`,
      time: hourly.time[gust],
    });
  }

  // Today and tomorrow's extremes, plus the feels-like temperature hour by hour: humid heat
  // and wind chill can be dangerous even when the air temperature alone is not.
  const hotDay = daily.temperatureMax.slice(0, 2).findIndex((t) => atLeast(t, 35));
  const hotFeel = firstHour((i) => atLeast(hourly.apparentTemperature[i], 40));
  if (hotDay >= 0 || hotFeel >= 0) {
    const max = Math.max(-Infinity, ...present(daily.temperatureMax.slice(0, 2)));
    const feels = Math.max(-Infinity, ...present(hourly.apparentTemperature));
    const extreme = max >= 38 || feels >= 45;
    const parts = [
      max >= 35 && `Máxima de ${Math.round(max)}°`,
      feels >= 40 && feels > max && `sensação térmica de até ${Math.round(feels)}°`,
    ].filter(Boolean);
    risks.push({
      id: "heat",
      level: extreme ? "alerta" : "atenção",
      title: extreme ? "Calor extremo" : "Calor intenso",
      detail: `${sentence(parts)}. Beba água e evite o sol no meio do dia.`,
      time: hotDay >= 0 ? daily.time[hotDay] : hourly.time[hotFeel],
      allDay: hotDay >= 0,
    });
  }

  const coldDay = daily.temperatureMin.slice(0, 2).findIndex((t) => atMost(t, 3));
  const coldFeel = firstHour((i) => atMost(hourly.apparentTemperature[i], 0));
  if (coldDay >= 0 || coldFeel >= 0) {
    const min = Math.min(Infinity, ...present(daily.temperatureMin.slice(0, 2)));
    const feels = Math.min(Infinity, ...present(hourly.apparentTemperature));
    const extreme = min <= 0 || feels <= -5;
    const parts = [
      min <= 3 && `Mínima de ${Math.round(min)}°`,
      feels <= 0 && feels < min && `sensação térmica de ${Math.round(feels)}°`,
    ].filter(Boolean);
    risks.push({
      id: "cold",
      level: extreme ? "alerta" : "atenção",
      title: min <= 1 ? "Frio intenso e geada" : extreme ? "Frio extremo" : "Frio intenso",
      detail: `${sentence(parts)}. Proteja plantas, animais e pessoas vulneráveis.`,
      time: coldDay >= 0 ? daily.time[coldDay] : hourly.time[coldFeel],
      allDay: coldDay >= 0,
    });
  }

  const uv = daily.uvIndexMax.slice(0, 2).findIndex((v) => atLeast(v, 8));
  if (uv >= 0) {
    const max = Math.max(...present(daily.uvIndexMax.slice(0, 2)));
    risks.push({
      id: "uv",
      level: max >= 11 ? "alerta" : "atenção",
      title: "Índice UV muito alto",
      detail: `UV até ${Math.round(max)}. Use protetor e evite o sol entre 10h e 16h.`,
      time: daily.time[uv],
      allDay: true,
    });
  }

  const fog = firstHour((i) => hourly.visibility[i] != null && hourly.visibility[i]! < 1000);
  if (fog >= 0) {
    risks.push({
      id: "fog",
      level: "atenção",
      title: "Neblina",
      detail: "Visibilidade abaixo de 1 km. Dirija com cuidado e farol baixo.",
      time: hourly.time[fog],
    });
  }

  // Alerts first; within a level, keep the order above (most dangerous first).
  const order: Record<RiskLevel, number> = { alerta: 0, atenção: 1 };
  return risks.sort((a, b) => order[a.level] - order[b.level]);
}

/** Joins phrases as "A e b", capitalising the first one. */
function sentence(parts: (string | false)[]): string {
  const text = parts.join(" e ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Thunderstorms, gusts and temperature extremes: shown as a highlighted warning on top. */
const SEVERE_WEATHER = new Set(["storm", "wind", "heat", "cold"]);

export function isSevereWeather(risk: Risk): boolean {
  return SEVERE_WEATHER.has(risk.id);
}

/** When the risk starts, relative to now: "agora", "a partir das 15h", "amanhã", "Sex, 09h". */
export function riskWhen(risk: Risk, now: number, timezone: string): string {
  const { time } = risk;
  if (risk.allDay) {
    if (formatWeekday(time, timezone) === formatWeekday(now, timezone)) return "hoje";
    if (formatWeekday(time, timezone) === formatWeekday(now + 86_400, timezone)) return "amanhã";
    return formatWeekday(time, timezone);
  }
  if (time <= now + 1800) return "agora";
  const sameDay = formatWeekday(time, timezone) === formatWeekday(now, timezone);
  return sameDay
    ? `a partir das ${formatHour(time, timezone)}`
    : `${formatWeekday(time, timezone)}, ${formatHour(time, timezone)}`;
}
