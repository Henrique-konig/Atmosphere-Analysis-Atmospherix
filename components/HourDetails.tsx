import { ArrowUp, Droplets, Leaf, Sun } from "lucide-react";
import { aqiLevel, describeWeather, uvLevel, uvTone } from "@/lib/conditions";
import {
  compassPoint,
  formatHour,
  formatRainAmount,
  formatSpeed,
  formatSpeedNumber,
  formatTemp,
  MISSING,
} from "@/lib/format";
import { t } from "@/lib/i18n";
import type { HourlyForecast } from "@/lib/types";

/**
 * One hour of an hourly strip read as a sentence, for screen readers: the strip itself
 * is a grid of short values and icons that make little sense one by one.
 */
export function describeHour(
  hourly: HourlyForecast,
  index: number,
  timezone: string,
  options: { now?: boolean; temperature?: number | null; aqi?: number | null } = {},
): string {
  const speed = hourly.windSpeed[index];
  const gust = hourly.windGusts[index];
  const direction = hourly.windDirection[index];
  const rain = hourly.precipitation[index];
  const prob = hourly.precipitationProbability[index];
  const uv = hourly.uvIndex[index];
  const parts = [
    options.now ? t("common.now") : formatHour(hourly.time[index], timezone),
    describeWeather(hourly.weatherCode[index], hourly.isDay[index]).label,
    formatTemp(options.temperature !== undefined ? options.temperature : hourly.temperature[index]),
  ];
  if (prob != null && prob >= 20) parts.push(t("hourly.rainChance", { prob }));
  if (speed != null) {
    const kmh = formatSpeed(speed);
    parts.push(
      direction == null
        ? t("hourly.windSpeed", { speed: kmh })
        : t("hourly.windSpeedFrom", { direction: compassPoint(direction), speed: kmh }),
    );
  }
  if (gust != null) parts.push(t("hourly.gustsSpeed", { speed: formatSpeed(gust) }));
  if (rain != null && rain >= 0.05)
    parts.push(t("hourly.rainAmount", { mm: formatRainAmount(rain) }));
  if (uv != null) parts.push(t("hourly.uv", { uv: Math.round(uv) }));
  if (options.aqi != null) {
    parts.push(
      t("air.index", {
        aqi: Math.round(options.aqi),
        level: aqiLevel(options.aqi).label.toLowerCase(),
      }),
    );
  }
  return parts.join(", ");
}

/**
 * Wind (speed, direction, gusts), rain amount, UV index and air quality under one hour of the
 * hourly strip. `aqi` is undefined when the air quality is not loaded at all, null when the
 * model has no value for this hour.
 */
export default function HourDetails({
  hourly,
  index,
  aqi,
}: {
  hourly: HourlyForecast;
  index: number;
  aqi?: number | null;
}) {
  const uv = hourly.uvIndex[index];
  const roundedUv = uv == null ? null : Math.round(uv);
  const air = aqi == null ? null : aqiLevel(aqi);
  const speed = hourly.windSpeed[index];
  const gust = hourly.windGusts[index];
  const direction = hourly.windDirection[index];
  const rain = hourly.precipitation[index];
  const wet = rain != null && rain >= 0.05;

  return (
    <span className="hourly-details" aria-hidden>
      <span
        className="hourly-wind"
        title={
          direction == null
            ? t("common.wind")
            : t("common.windFrom", { direction: compassPoint(direction) })
        }
      >
        {direction != null && (
          <ArrowUp
            size={11}
            aria-hidden
            className="hourly-wind-arrow"
            style={{ transform: `rotate(${direction + 180}deg)` }}
          />
        )}
        {formatSpeed(speed)}
      </span>
      <span className="hourly-gust" title={t("common.gusts")}>
        {gust == null ? MISSING : t("hourly.gustShort", { speed: formatSpeedNumber(gust) })}
      </span>
      <span className={wet ? "hourly-rain wet" : "hourly-rain"} title={t("common.precipitation")}>
        <Droplets size={11} aria-hidden />
        {formatRainAmount(rain)}
      </span>
      <span
        className={roundedUv == null ? "hourly-uv" : `hourly-uv uv-${uvTone(roundedUv)}`}
        title={
          roundedUv == null
            ? t("uv.title")
            : `${t("uv.title")} ${uvLevel(roundedUv).label.toLowerCase()}`
        }
      >
        <Sun size={11} aria-hidden />
        {roundedUv == null ? MISSING : `UV ${roundedUv}`}
      </span>
      {aqi !== undefined && (
        <span
          className={air ? `hourly-aqi aqi-${air.tone}` : "hourly-aqi"}
          title={air ? `${t("air.title")}: ${air.label.toLowerCase()}` : t("air.title")}
        >
          <Leaf size={11} aria-hidden />
          {aqi == null ? MISSING : t("air.short", { aqi: Math.round(aqi) })}
        </span>
      )}
    </span>
  );
}
