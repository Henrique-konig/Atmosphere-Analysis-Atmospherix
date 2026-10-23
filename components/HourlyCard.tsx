import { Clock, Sunrise, Sunset } from "lucide-react";
import { aqiAt } from "@/lib/airquality";
import { describeWeather } from "@/lib/conditions";
import { formatHour, formatSpeed, formatTemp, formatTime, present } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { AirQuality, Forecast } from "@/lib/types";
import Card from "./Card";
import HourDetails, { describeHour } from "./HourDetails";
import ScrollStrip from "./ScrollStrip";
import WeatherIcon from "./WeatherIcon";

const HOURS = 24;

type Item =
  { kind: "hour"; time: number; index: number } | { kind: "sun"; time: number; rise: boolean };

export default function HourlyCard({
  forecast,
  airQuality,
}: {
  forecast: Forecast;
  airQuality: AirQuality | null;
}) {
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
      ? t("hourly.summaryGusts", {
          condition: condition.label,
          speed: formatSpeed(Math.max(...gusts)),
        })
      : t("hourly.summary", { condition: condition.label });

  return (
    <Card title={t("hourly.title")} icon={Clock} className="hourly">
      <p className="card-summary">{summary}</p>
      <ScrollStrip className="hourly-strip" label={t("hourly.next24")}>
        {items.map((item) => {
          if (item.kind === "sun") {
            const label = item.rise ? t("common.sunrise") : t("common.sunset");
            return (
              <li key={`s${item.time}`} className="hourly-sun">
                <span className="sr-only">{`${formatTime(item.time, timezone)}, ${label}`}</span>
                <span className="hourly-time" aria-hidden>
                  {formatTime(item.time, timezone)}
                </span>
                <span className="hourly-icon" aria-hidden>
                  {item.rise ? (
                    <Sunrise size={26} className="weather-icon icon-sun" aria-hidden />
                  ) : (
                    <Sunset size={26} className="weather-icon icon-sun" aria-hidden />
                  )}
                </span>
                <span className="hourly-temp" aria-hidden>
                  {label}
                </span>
              </li>
            );
          }
          const aqi = airQuality ? aqiAt(airQuality, item.time) : undefined;
          return (
            <li key={`h${item.time}`}>
              <span className="sr-only">
                {describeHour(hourly, item.index, timezone, {
                  now: item.index === 0,
                  temperature: item.index === 0 ? current.temperature : undefined,
                  aqi,
                })}
              </span>
              <span className="hourly-time" aria-hidden>
                {item.index === 0 ? t("common.now") : formatHour(item.time, timezone)}
              </span>
              <span className="hourly-icon" aria-hidden>
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
              <span className="hourly-temp" aria-hidden>
                {formatTemp(
                  item.index === 0 ? current.temperature : hourly.temperature[item.index],
                )}
              </span>
              <HourDetails hourly={hourly} index={item.index} aqi={aqi} />
            </li>
          );
        })}
      </ScrollStrip>
    </Card>
  );
}
