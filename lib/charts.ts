import type { Forecast } from "./types";

export type Metric = "temperature" | "rain" | "wind";
export type Period = "hours" | "days";

export interface ChartSeries {
  label: string;
  values: (number | null)[];
  kind: "line" | "bar";
  /** CSS class that colours the series and its legend swatch. */
  tone: string;
  dashed?: boolean;
  /** Drawn on its own 0–100 scale (a chance in %), without axis labels. */
  percent?: boolean;
}

export interface ChartData {
  times: number[];
  series: ChartSeries[];
  /** Wind direction per point, drawn as arrows under the plot. */
  directions?: (number | null)[];
  unit: string;
  /** Rain and wind start at zero; temperature fits its range. */
  fromZero: boolean;
}

/** The series each chart shows: the next 48 hours, or the forecast days. */
export function chartData(forecast: Forecast, metric: Metric, period: Period): ChartData {
  const h = forecast.hourly;
  const d = forecast.daily;
  const hours = period === "hours";
  const times = hours ? h.time : d.time;

  if (metric === "temperature") {
    return {
      times,
      unit: "°",
      fromZero: false,
      series: hours
        ? [
            { label: "Temperatura", values: h.temperature, kind: "line", tone: "tone-temp" },
            {
              label: "Sensação",
              values: h.apparentTemperature,
              kind: "line",
              tone: "tone-feels",
              dashed: true,
            },
          ]
        : [
            { label: "Máxima", values: d.temperatureMax, kind: "line", tone: "tone-max" },
            { label: "Mínima", values: d.temperatureMin, kind: "line", tone: "tone-min" },
          ],
    };
  }

  if (metric === "rain") {
    return {
      times,
      unit: " mm",
      fromZero: true,
      series: [
        {
          label: hours ? "Chuva por hora" : "Chuva no dia",
          values: hours ? h.precipitation : d.precipitationSum,
          kind: "bar",
          tone: "tone-rain",
        },
        {
          label: "Chance de chuva",
          values: hours ? h.precipitationProbability : d.precipitationProbabilityMax,
          kind: "line",
          tone: "tone-chance",
          dashed: true,
          percent: true,
        },
      ],
    };
  }

  return {
    times,
    unit: " km/h",
    fromZero: true,
    directions: hours ? h.windDirection : d.windDirectionDominant,
    series: [
      {
        label: hours ? "Vento" : "Vento máximo",
        values: hours ? h.windSpeed : d.windSpeedMax,
        kind: "line",
        tone: "tone-wind",
      },
      {
        label: hours ? "Rajadas" : "Rajadas máximas",
        values: hours ? h.windGusts : d.windGustsMax,
        kind: "line",
        tone: "tone-gust",
        dashed: true,
      },
    ],
  };
}

/** A round axis range around [min, max] with about `count` evenly spaced ticks. */
export function niceScale(
  min: number,
  max: number,
  count = 4,
): { lo: number; hi: number; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { lo: 0, hi: 1, ticks: [0, 1] };
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, ticks };
}

/** SVG path through the points, broken where a value is missing. */
export function linePath(
  values: (number | null)[],
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  let path = "";
  let open = false;
  values.forEach((v, i) => {
    if (v == null) {
      open = false;
      return;
    }
    path += `${path ? " " : ""}${open ? "L" : "M"}${round(x(i))},${round(y(v))}`;
    open = true;
  });
  return path;
}

const round = (v: number) => Math.round(v * 10) / 10;
