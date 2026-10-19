import { describeWeather } from "./conditions";
import { formatHour, present } from "./format";
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
    warmestHour,
  };
}

/** "Chuva fraca. Máxima de 27°, por volta das 15h, e mínima de 15°. …" */
export function daySummary(d: DayDetails, timeZone: string): string {
  const parts = [`${describeWeather(d.weatherCode).label}.`];
  if (d.max != null && d.min != null) {
    const when =
      d.warmestHour != null ? `, por volta das ${formatHour(d.warmestHour, timeZone)},` : "";
    parts.push(`Máxima de ${Math.round(d.max)}°${when} e mínima de ${Math.round(d.min)}°.`);
  }
  const prob = d.precipitationProbability;
  const mm = d.precipitation;
  if ((prob != null && prob >= 20) || (mm != null && mm >= 0.5)) {
    const chance = prob != null ? `Chance de chuva de ${prob}%` : "Chuva prevista";
    const total = mm != null && mm >= 0.5 ? `, com cerca de ${Math.round(mm)} mm no total` : "";
    parts.push(`${chance}${total}.`);
  } else if (prob != null || mm != null) {
    parts.push("Sem chuva prevista.");
  }
  if (d.gustsMax != null && d.gustsMax >= 50) {
    parts.push(`Rajadas de vento de até ${Math.round(d.gustsMax)} km/h.`);
  }
  return parts.join(" ");
}
