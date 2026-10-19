import { CalendarDays } from "lucide-react";
import { colorAt, TEMPERATURE_SCALE } from "@/lib/colors";
import { describeWeather } from "@/lib/conditions";
import { formatTemp, formatWeekday } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import Card from "./Card";
import WeatherIcon from "./WeatherIcon";

const rgb = (t: number) => {
  const [r, g, b] = colorAt(TEMPERATURE_SCALE, t);
  return `rgb(${r},${g},${b})`;
};

export default function DailyCard({ forecast }: { forecast: Forecast }) {
  const { daily, timezone, current } = forecast;
  const low = Math.min(...daily.temperatureMin);
  const high = Math.max(...daily.temperatureMax);
  const span = Math.max(1, high - low);
  const pct = (t: number) => ((t - low) / span) * 100;

  return (
    <Card title={`Previsão para ${daily.time.length} dias`} icon={CalendarDays} className="daily">
      <ol className="daily-list">
        {daily.time.map((time, i) => {
          const min = daily.temperatureMin[i];
          const max = daily.temperatureMax[i];
          const prob = daily.precipitationProbabilityMax[i];
          return (
            <li key={time}>
              <span className="daily-day">{i === 0 ? "Hoje" : formatWeekday(time, timezone)}</span>
              <span className="daily-icon">
                <WeatherIcon kind={describeWeather(daily.weatherCode[i]).icon} size={22} />
                {prob >= 20 && <span className="daily-prob">{prob}%</span>}
              </span>
              <span className="daily-min">{formatTemp(min)}</span>
              <span
                className="range"
                role="img"
                aria-label={`Mínima ${Math.round(min)} graus, máxima ${Math.round(max)} graus`}
              >
                <span
                  className="range-fill"
                  style={{
                    left: `${pct(min)}%`,
                    right: `${100 - pct(max)}%`,
                    background: `linear-gradient(90deg, ${rgb(min)}, ${rgb((min + max) / 2)}, ${rgb(max)})`,
                  }}
                />
                {i === 0 && (
                  <span
                    className="range-now"
                    style={{ left: `${Math.min(100, Math.max(0, pct(current.temperature)))}%` }}
                  />
                )}
              </span>
              <span className="daily-max">{formatTemp(max)}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
