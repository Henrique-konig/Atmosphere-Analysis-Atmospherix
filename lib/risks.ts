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
  const risks: Risk[] = [];
  const firstHour = (test: (i: number) => boolean) => hourly.time.findIndex((_, i) => test(i));

  const storm = firstHour((i) => hourly.weatherCode[i] >= 95);
  if (storm >= 0) {
    const hail = hourly.weatherCode.some((c) => c === 96 || c === 99);
    risks.push({
      id: "storm",
      level: hail ? "alerta" : "atenção",
      title: hail ? "Tempestade com granizo" : "Tempestades",
      detail: "Trovoadas previstas. Evite áreas abertas e fique longe de árvores.",
      time: hourly.time[storm],
    });
  }

  const maxRainHour = Math.max(0, ...hourly.precipitation);
  const heavyHour = firstHour((i) => hourly.precipitation[i] >= 10);
  const heavyDay = daily.precipitationSum.slice(0, 2).findIndex((mm) => mm >= 50);
  if (heavyHour >= 0 || heavyDay >= 0) {
    const severe = maxRainHour >= 25 || daily.precipitationSum.slice(0, 2).some((mm) => mm >= 80);
    risks.push({
      id: "rain",
      level: severe ? "alerta" : "atenção",
      title: "Chuva forte",
      detail:
        heavyHour >= 0
          ? `Até ${Math.round(maxRainHour)} mm em uma hora. Risco de alagamentos.`
          : `Acumulado de ${Math.round(daily.precipitationSum[heavyDay])} mm no dia. Risco de alagamentos.`,
      time: heavyHour >= 0 ? hourly.time[heavyHour] : daily.time[heavyDay],
      allDay: heavyHour < 0,
    });
  }

  const maxGust = Math.max(0, ...hourly.windGusts);
  const gust = firstHour((i) => hourly.windGusts[i] >= 60);
  if (gust >= 0) {
    risks.push({
      id: "wind",
      level: maxGust >= 80 ? "alerta" : "atenção",
      title: "Ventos fortes",
      detail: `Rajadas de até ${Math.round(maxGust)} km/h. Cuidado com objetos soltos e árvores.`,
      time: hourly.time[gust],
    });
  }

  const hot = daily.temperatureMax.slice(0, 2).findIndex((t) => t >= 35);
  if (hot >= 0) {
    const max = Math.max(...daily.temperatureMax.slice(0, 2));
    risks.push({
      id: "heat",
      level: max >= 38 ? "alerta" : "atenção",
      title: "Calor intenso",
      detail: `Máxima de ${Math.round(max)}°. Beba água e evite o sol no meio do dia.`,
      time: daily.time[hot],
      allDay: true,
    });
  }

  const cold = daily.temperatureMin.slice(0, 2).findIndex((t) => t <= 3);
  if (cold >= 0) {
    const min = Math.min(...daily.temperatureMin.slice(0, 2));
    risks.push({
      id: "cold",
      level: min <= 0 ? "alerta" : "atenção",
      title: min <= 1 ? "Frio intenso e geada" : "Frio intenso",
      detail: `Mínima de ${Math.round(min)}°. Proteja plantas, animais e pessoas vulneráveis.`,
      time: daily.time[cold],
      allDay: true,
    });
  }

  const uv = daily.uvIndexMax.slice(0, 2).findIndex((v) => v >= 8);
  if (uv >= 0) {
    const max = Math.max(...daily.uvIndexMax.slice(0, 2));
    risks.push({
      id: "uv",
      level: max >= 11 ? "alerta" : "atenção",
      title: "Índice UV muito alto",
      detail: `UV até ${Math.round(max)}. Use protetor e evite o sol entre 10h e 16h.`,
      time: daily.time[uv],
      allDay: true,
    });
  }

  const fog = firstHour((i) => hourly.visibility[i] > 0 && hourly.visibility[i] < 1000);
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
