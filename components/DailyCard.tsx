import { CalendarDays } from "lucide-react";
import { temperatureColor as rgb } from "@/lib/colors";
import { describeWeather } from "@/lib/conditions";
import { formatTemp, formatTempNumber, formatWeekday, present } from "@/lib/format";
import { t } from "@/lib/i18n";
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
    <Card
      title={t("daily.title", { days: daily.time.length })}
      icon={CalendarDays}
      className="daily"
    >
      <ol className="daily-list">
        {daily.time.map((time, i) => {
          const min = daily.temperatureMin[i];
          const max = daily.temperatureMax[i];
          const prob = daily.precipitationProbabilityMax[i];
          const name = i === 0 ? t("common.today") : formatWeekday(time, timezone);
          const condition = describeWeather(daily.weatherCode[i]);
          const label = [
            name,
            condition.label,
            t("common.minMax", { min: formatTempNumber(min), max: formatTempNumber(max) }),
            prob != null && prob >= 20 ? t("hourly.rainChance", { prob }) : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <li key={time}>
              <button
                type="button"
                className="daily-row"
                onClick={() => onSelectDay(i)}
                aria-haspopup="dialog"
                aria-label={label}
              >
                <span className="daily-day">{name}</span>
                <span className="daily-icon">
                  <WeatherIcon kind={condition.icon} size={22} />
                  {prob != null && prob >= 20 && <span className="daily-prob">{prob}%</span>}
                </span>
                <span className="daily-min">{formatTemp(min)}</span>
                <span className="range">
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
      <p className="card-note">{t("daily.hint")}</p>
    </Card>
  );
}
