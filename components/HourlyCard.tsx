import { Clock, Sunrise, Sunset } from "lucide-react";
import { describeWeather } from "@/lib/conditions";
import { formatHour, formatTemp, formatTime, present } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import Card from "./Card";
import WeatherIcon from "./WeatherIcon";

const HOURS = 24;

type Item =
  { kind: "hour"; time: number; index: number } | { kind: "sun"; time: number; rise: boolean };

export default function HourlyCard({ forecast }: { forecast: Forecast }) {
  const { hourly, daily, timezone, current } = forecast;
  const end = hourly.time[Math.min(HOURS, hourly.time.length) - 1] ?? 0;

  const items: Item[] = hourly.time
    .slice(0, HOURS)
    .map((time, index) => ({ kind: "hour", time, index }));
  for (const [list, rise] of [
    [daily.sunrise, true],
    [daily.sunset, false],
  ] as const) {
    for (const time of list) {
      if (time != null && time > current.time && time < end)
        items.push({ kind: "sun", time, rise });
    }
  }
  items.sort((a, b) => a.time - b.time);

  const condition = describeWeather(current.weatherCode, current.isDay);
  const gusts = present(hourly.windGusts.slice(0, HOURS));
  const summary =
    gusts.length > 0
      ? `${condition.label} agora. Rajadas de vento de até ${Math.round(Math.max(...gusts))} km/h nas próximas horas.`
      : `${condition.label} agora.`;

  return (
    <Card title="Previsão por hora" icon={Clock} className="hourly">
      <p className="card-summary">{summary}</p>
      <ol className="hourly-strip" tabIndex={0} aria-label="Próximas 24 horas">
        {items.map((item) =>
          item.kind === "hour" ? (
            <li key={`h${item.time}`}>
              <span className="hourly-time">
                {item.index === 0 ? "Agora" : formatHour(item.time, timezone)}
              </span>
              <span className="hourly-icon">
                <WeatherIcon
                  kind={
                    describeWeather(hourly.weatherCode[item.index], hourly.isDay[item.index]).icon
                  }
                  size={26}
                />
                {(hourly.precipitationProbability[item.index] ?? 0) >= 20 && (
                  <span className="hourly-prob">
                    {hourly.precipitationProbability[item.index]}%
                  </span>
                )}
              </span>
              <span className="hourly-temp">
                {formatTemp(
                  item.index === 0 ? current.temperature : hourly.temperature[item.index],
                )}
              </span>
            </li>
          ) : (
            <li key={`s${item.time}`} className="hourly-sun">
              <span className="hourly-time">{formatTime(item.time, timezone)}</span>
              <span className="hourly-icon">
                {item.rise ? (
                  <Sunrise size={26} className="weather-icon icon-sun" aria-hidden />
                ) : (
                  <Sunset size={26} className="weather-icon icon-sun" aria-hidden />
                )}
              </span>
              <span className="hourly-temp">{item.rise ? "Nascer" : "Pôr do sol"}</span>
            </li>
          ),
        )}
      </ol>
    </Card>
  );
}
