export type IconKind =
  | "sun"
  | "moon"
  | "cloud-sun"
  | "cloud-moon"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "storm";

/** Background mood of the screen, picked from the current conditions. */
export type Theme =
  "clear-day" | "clear-night" | "cloudy-day" | "cloudy-night" | "rain" | "storm" | "snow" | "fog";

export interface Condition {
  label: string;
  icon: IconKind;
  theme: Theme;
}

/** WMO weather interpretation codes, as returned by Open-Meteo. */
export function describeWeather(code: number | null, isDay = true): Condition {
  const sky = isDay ? "day" : "night";
  if (code == null) return { label: "Indisponível", icon: "cloud", theme: `cloudy-${sky}` };
  if (code === 0) {
    return {
      label: isDay ? "Ensolarado" : "Céu limpo",
      icon: isDay ? "sun" : "moon",
      theme: `clear-${sky}`,
    };
  }
  if (code === 1) {
    return {
      label: "Predomínio de sol",
      icon: isDay ? "cloud-sun" : "cloud-moon",
      theme: `clear-${sky}`,
    };
  }
  if (code === 2) {
    return {
      label: "Parcialmente nublado",
      icon: isDay ? "cloud-sun" : "cloud-moon",
      theme: `cloudy-${sky}`,
    };
  }
  if (code === 3) return { label: "Nublado", icon: "cloud", theme: `cloudy-${sky}` };
  if (code === 45 || code === 48) return { label: "Nevoeiro", icon: "fog", theme: "fog" };
  if (code >= 51 && code <= 57) return { label: "Garoa", icon: "drizzle", theme: "rain" };
  if (code === 61 || code === 80) return { label: "Chuva fraca", icon: "drizzle", theme: "rain" };
  if (code === 63 || code === 81) return { label: "Chuva", icon: "rain", theme: "rain" };
  if (code === 65 || code === 82)
    return { label: "Chuva forte", icon: "heavy-rain", theme: "rain" };
  if (code === 66 || code === 67) return { label: "Chuva congelante", icon: "rain", theme: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: "Neve", icon: "snow", theme: "snow" };
  }
  if (code === 95) return { label: "Trovoadas", icon: "storm", theme: "storm" };
  if (code === 96 || code === 99)
    return { label: "Trovoadas com granizo", icon: "storm", theme: "storm" };
  return { label: "Indisponível", icon: "cloud", theme: `cloudy-${sky}` };
}

export function uvLevel(uv: number): { label: string; advice: string } {
  if (uv < 3) return { label: "Baixo", advice: "Sem necessidade de proteção." };
  if (uv < 6) return { label: "Moderado", advice: "Use protetor solar ao sair." };
  if (uv < 8) return { label: "Alto", advice: "Evite o sol entre 10h e 16h." };
  if (uv < 11) return { label: "Muito alto", advice: "Proteção extra: chapéu, óculos e protetor." };
  return { label: "Extremo", advice: "Evite se expor ao sol." };
}

export function visibilityLabel(meters: number): string {
  if (meters >= 20_000) return "Visibilidade excelente.";
  if (meters >= 10_000) return "Boa visibilidade.";
  if (meters >= 4_000) return "Visibilidade moderada.";
  if (meters >= 1_000) return "Visibilidade reduzida.";
  return "Neblina: visibilidade muito baixa.";
}

export function feelsLikeLabel(actual: number, feels: number, humidity: number | null): string {
  const diff = feels - actual;
  if (diff >= 2)
    return humidity != null && humidity >= 60
      ? "A umidade faz parecer mais quente."
      : "Parece mais quente que a temperatura real.";
  if (diff <= -2) return "O vento faz parecer mais frio.";
  return "Parecida com a temperatura real.";
}

export function humidityLabel(dewPoint: number): string {
  if (dewPoint >= 21) return `Abafado. O ponto de orvalho é de ${Math.round(dewPoint)}°.`;
  if (dewPoint >= 16) return `Um pouco úmido. O ponto de orvalho é de ${Math.round(dewPoint)}°.`;
  return `Agradável. O ponto de orvalho é de ${Math.round(dewPoint)}°.`;
}

/** Compares the pressure now with a few hours ahead. */
export function pressureTrend(now: number, later: number): "subindo" | "estável" | "caindo" {
  if (later - now >= 1) return "subindo";
  if (now - later >= 1) return "caindo";
  return "estável";
}
