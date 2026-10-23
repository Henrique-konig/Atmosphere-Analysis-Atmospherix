import { formatTemp } from "./format";
import { t } from "./i18n";

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
  if (code == null)
    return { label: t("common.unavailable"), icon: "cloud", theme: `cloudy-${sky}` };
  if (code === 0) {
    return {
      label: isDay ? t("weather.sunny") : t("weather.clear"),
      icon: isDay ? "sun" : "moon",
      theme: `clear-${sky}`,
    };
  }
  if (code === 1) {
    return {
      label: t("weather.mostlySunny"),
      icon: isDay ? "cloud-sun" : "cloud-moon",
      theme: `clear-${sky}`,
    };
  }
  if (code === 2) {
    return {
      label: t("weather.partlyCloudy"),
      icon: isDay ? "cloud-sun" : "cloud-moon",
      theme: `cloudy-${sky}`,
    };
  }
  if (code === 3) return { label: t("weather.cloudy"), icon: "cloud", theme: `cloudy-${sky}` };
  if (code === 45 || code === 48) return { label: t("weather.fog"), icon: "fog", theme: "fog" };
  if (code >= 51 && code <= 57)
    return { label: t("weather.drizzle"), icon: "drizzle", theme: "rain" };
  if (code === 61 || code === 80)
    return { label: t("weather.lightRain"), icon: "drizzle", theme: "rain" };
  if (code === 63 || code === 81) return { label: t("weather.rain"), icon: "rain", theme: "rain" };
  if (code === 65 || code === 82)
    return { label: t("weather.heavyRain"), icon: "heavy-rain", theme: "rain" };
  if (code === 66 || code === 67)
    return { label: t("weather.freezingRain"), icon: "rain", theme: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: t("weather.snow"), icon: "snow", theme: "snow" };
  }
  if (code === 95) return { label: t("weather.storm"), icon: "storm", theme: "storm" };
  if (code === 96 || code === 99)
    return { label: t("weather.hail"), icon: "storm", theme: "storm" };
  return { label: t("common.unavailable"), icon: "cloud", theme: `cloudy-${sky}` };
}

export function uvLevel(uv: number): { label: string; advice: string } {
  if (uv < 3) return { label: t("uv.low"), advice: t("uv.lowAdvice") };
  if (uv < 6) return { label: t("uv.moderate"), advice: t("uv.moderateAdvice") };
  if (uv < 8) return { label: t("uv.high"), advice: t("uv.highAdvice") };
  if (uv < 11) return { label: t("uv.veryHigh"), advice: t("uv.veryHighAdvice") };
  return { label: t("uv.extreme"), advice: t("uv.extremeAdvice") };
}

export interface AqiLevel {
  label: string;
  advice: string;
  /** CSS class suffix for the level colour. */
  tone: "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";
}

/** US EPA AQI categories. */
export function aqiLevel(aqi: number): AqiLevel {
  if (aqi <= 50) return { label: t("air.good"), advice: t("air.goodAdvice"), tone: "good" };
  if (aqi <= 100)
    return {
      label: t("air.moderate"),
      advice: t("air.moderateAdvice"),
      tone: "moderate",
    };
  if (aqi <= 150)
    return {
      label: t("air.sensitive"),
      advice: t("air.sensitiveAdvice"),
      tone: "sensitive",
    };
  if (aqi <= 200)
    return { label: t("air.unhealthy"), advice: t("air.unhealthyAdvice"), tone: "unhealthy" };
  if (aqi <= 300)
    return {
      label: t("air.veryUnhealthy"),
      advice: t("air.veryUnhealthyAdvice"),
      tone: "very-unhealthy",
    };
  return { label: t("air.hazardous"), advice: t("air.hazardousAdvice"), tone: "hazardous" };
}

/** UV colour class suffix, matching the UV bar. */
export function uvTone(uv: number): "low" | "moderate" | "high" | "very-high" | "extreme" {
  if (uv < 3) return "low";
  if (uv < 6) return "moderate";
  if (uv < 8) return "high";
  if (uv < 11) return "very-high";
  return "extreme";
}

export function visibilityLabel(meters: number): string {
  if (meters >= 20_000) return t("visibility.excellent");
  if (meters >= 10_000) return t("visibility.good");
  if (meters >= 4_000) return t("visibility.moderate");
  if (meters >= 1_000) return t("visibility.reduced");
  return t("visibility.fog");
}

export function feelsLikeLabel(actual: number, feels: number, humidity: number | null): string {
  const diff = feels - actual;
  if (diff >= 2) return humidity != null && humidity >= 60 ? t("feels.humid") : t("feels.warmer");
  if (diff <= -2) return t("feels.colder");
  return t("feels.same");
}

export function humidityLabel(dewPoint: number): string {
  if (dewPoint >= 21) return t("humidity.muggy", { dew: formatTemp(dewPoint) });
  if (dewPoint >= 16) return t("humidity.humid", { dew: formatTemp(dewPoint) });
  return t("humidity.pleasant", { dew: formatTemp(dewPoint) });
}

/** Compares the pressure now with a few hours ahead. */
export function pressureTrend(now: number, later: number): "subindo" | "estável" | "caindo" {
  if (later - now >= 1) return "subindo";
  if (now - later >= 1) return "caindo";
  return "estável";
}
