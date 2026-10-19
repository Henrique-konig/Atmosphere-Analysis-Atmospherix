import { CalendarDays } from "lucide-react";
import { temperatureColor as rgb } from "@/lib/colors";
import { describeWeather } from "@/lib/conditions";
import { formatNumber, formatTemp, formatWeekday, present } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import Card from "./Card";
import WeatherIcon from "./WeatherIcon";

interface Props {
  forecast: Forecast;
  /** Opens the details of a day. */
  onSelectDay: (day: number) => void;
}

export default function DailyCard({ forecast, onSelectDay }: Props) {
  const { daily, timezone, current } = forecast;
  const low = Math.min(...present(daily.temperatureMin));
  const high = Math.max(...present(daily.temperatureMax));
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
              <button
                type="button"
                className="daily-row"
                onClick={() => onSelectDay(i)}
                aria-haspopup="dialog"
              >
                <span className="daily-day">
                  {i === 0 ? "Hoje" : formatWeekday(time, timezone)}
                </span>
                <span className="daily-icon">
                  <WeatherIcon kind={describeWeather(daily.weatherCode[i]).icon} size={22} />
                  {prob != null && prob >= 20 && <span className="daily-prob">{prob}%</span>}
                </span>
                <span className="daily-min">{formatTemp(min)}</span>
                <span
                  className="range"
                  role="img"
                  aria-label={`Mínima ${formatNumber(min)} graus, máxima ${formatNumber(max)} graus`}
                >
                  {min != null && max != null && (
                    <span
                      className="range-fill"
                      style={{
                        left: `${pct(min)}%`,
                        right: `${100 - pct(max)}%`,
                        background: `linear-gradient(90deg, ${rgb(min)}, ${rgb((min + max) / 2)}, ${rgb(max)})`,
                      }}
                    />
                  )}
                  {i === 0 && current.temperature != null && (
                    <span
                      className="range-now"
                      style={{ left: `${Math.min(100, Math.max(0, pct(current.temperature)))}%` }}
                    />
                  )}
                </span>
                <span className="daily-max">{formatTemp(max)}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="card-note">Toque em um dia para ver a previsão detalhada.</p>
    </Card>
  );
}
