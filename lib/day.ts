import { describeWeather } from "./conditions";
import { formatHour, formatRainAmount, formatSpeed, formatTemp, present } from "./format";
import { t } from "./i18n";
import { moonInfo, type MoonInfo } from "./moon";
import type { Forecast } from "./types";

interface Range {
  min: number;
  max: number;
}

/** Everything the day details show for one day of the forecast. */
export interface DayDetails {
  /** Local midnight of the day and of the next one (unix seconds). */
  start: number;
  end: number;
  /** Indices into `forecast.dayHours` that fall on this day. */
  hours: number[];
  weatherCode: number | null;
  max: number | null;
  min: number | null;
  feelsLike: Range | null;
  humidity: Range | null;
  dewPoint: Range | null;
  pressure: Range | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  windMax: number | null;
  gustsMax: number | null;
  windDirection: number | null;
  uvMax: number | null;
  sunrise: number | null;
  sunset: number | null;
  daylight: number | null;
  /** The moon at midday, local time. */
  moon: MoonInfo;
  /** Hour of the highest temperature, when the hourly data has it. */
  warmestHour: number | null;
}

function range(values: (number | null)[]): Range | null {
  const v = present(values);
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
}

export function dayDetails(forecast: Forecast, day: number): DayDetails {
  const { daily, dayHours } = forecast;
  const start = daily.time[day];
  // Days are not always 24 h long (daylight saving time): use the next midnight when known.
  const end = daily.time[day + 1] ?? start + 86_400;
  const hours = dayHours.time.flatMap((t, i) => (t >= start && t < end ? [i] : []));
  const pick = (series: (number | null)[]) => hours.map((i) => series[i]);

  let warmestHour: number | null = null;
  let warmest = -Infinity;
  for (const i of hours) {
    const t = dayHours.temperature[i];
    if (t != null && t > warmest) {
      warmest = t;
      warmestHour = dayHours.time[i];
    }
  }

  return {
    start,
    end,
    hours,
    weatherCode: daily.weatherCode[day],
    max: daily.temperatureMax[day],
    min: daily.temperatureMin[day],
    feelsLike: range(pick(dayHours.apparentTemperature)),
    humidity: range(pick(dayHours.humidity)),
    dewPoint: range(pick(dayHours.dewPoint)),
    pressure: range(pick(dayHours.pressure)),
    precipitation: daily.precipitationSum[day],
    precipitationProbability: daily.precipitationProbabilityMax[day],
    windMax: daily.windSpeedMax[day],
    gustsMax: daily.windGustsMax[day],
    windDirection: daily.windDirectionDominant[day],
    uvMax: daily.uvIndexMax[day],
    sunrise: daily.sunrise[day],
    sunset: daily.sunset[day],
    daylight: daily.daylightDuration[day],
    moon: moonInfo(start + 12 * 3600),
    warmestHour,
  };
}

/** "Chuva fraca. Máxima de 27°, por volta das 15h, e mínima de 15°. …" */
export function daySummary(d: DayDetails, timeZone: string): string {
  const parts = [`${describeWeather(d.weatherCode).label}.`];
  if (d.max != null && d.min != null) {
    const when =
      d.warmestHour != null
        ? t("day.summaryWhen", { hour: formatHour(d.warmestHour, timeZone) })
        : "";
    parts.push(t("day.summaryTemps", { max: formatTemp(d.max), when, min: formatTemp(d.min) }));
  }
  const prob = d.precipitationProbability;
  const mm = d.precipitation;
  if ((prob != null && prob >= 20) || (mm != null && mm >= 0.5)) {
    const chance = prob != null ? t("day.summaryChance", { prob }) : t("day.summaryRain");
    const total =
      mm != null && mm >= 0.5 ? t("day.summaryTotal", { mm: formatRainAmount(mm) }) : "";
    parts.push(`${chance}${total}.`);
  } else if (prob != null || mm != null) {
    parts.push(t("day.summaryDry"));
  }
  if (d.gustsMax != null && d.gustsMax >= 50) {
    parts.push(t("day.summaryGusts", { speed: formatSpeed(d.gustsMax) }));
  }
  if (d.moon.name === t("moon.full") || d.moon.name === t("moon.new"))
    parts.push(`${d.moon.name}.`);
  return parts.join(" ");
}
