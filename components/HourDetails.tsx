import { ArrowUp, Droplets, Leaf, Sun } from "lucide-react";
import { aqiLevel, uvLevel, uvTone } from "@/lib/conditions";
import { compassPoint, formatRain, MISSING } from "@/lib/format";
import type { HourlyForecast } from "@/lib/types";

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
    <span className="hourly-details">
      <span
        className="hourly-wind"
        title={direction == null ? "Vento" : `Vento de ${compassPoint(direction)}`}
      >
        {direction != null && (
          <ArrowUp
            size={11}
            aria-hidden
            className="hourly-wind-arrow"
            style={{ transform: `rotate(${direction + 180}deg)` }}
          />
        )}
        {speed == null ? MISSING : `${Math.round(speed)} km/h`}
      </span>
      <span className="hourly-gust" title="Rajadas">
        {gust == null ? MISSING : `raj. ${Math.round(gust)}`}
      </span>
      <span className={wet ? "hourly-rain wet" : "hourly-rain"} title="Precipitação">
        <Droplets size={11} aria-hidden />
        {rain == null ? MISSING : `${formatRain(rain)} mm`}
      </span>
      <span
        className={roundedUv == null ? "hourly-uv" : `hourly-uv uv-${uvTone(roundedUv)}`}
        title={
          roundedUv == null ? "Índice UV" : `Índice UV ${uvLevel(roundedUv).label.toLowerCase()}`
        }
      >
        <Sun size={11} aria-hidden />
        {roundedUv == null ? MISSING : `UV ${roundedUv}`}
      </span>
      {aqi !== undefined && (
        <span
          className={air ? `hourly-aqi aqi-${air.tone}` : "hourly-aqi"}
          title={air ? `Qualidade do ar ${air.label.toLowerCase()}` : "Qualidade do ar"}
        >
          <Leaf size={11} aria-hidden />
          {aqi == null ? MISSING : `IQA ${Math.round(aqi)}`}
        </span>
      )}
    </span>
  );
}
