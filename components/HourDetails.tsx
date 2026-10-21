import { ArrowUp, Droplets } from "lucide-react";
import { compassPoint, formatRain, MISSING } from "@/lib/format";
import type { HourlyForecast } from "@/lib/types";

/** Wind (speed, direction, gusts) and rain amount under one hour of the hourly strip. */
export default function HourDetails({ hourly, index }: { hourly: HourlyForecast; index: number }) {
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
    </span>
  );
}
