import { temperatureColor } from "@/lib/colors";
import { formatHour, formatTemp, present } from "@/lib/format";
import type { HourlyForecast } from "@/lib/types";

interface Props {
  hours: HourlyForecast;
  /** Indices into `hours` for the day shown. */
  indices: number[];
  start: number;
  end: number;
  timezone: string;
  /** Marks the current time, for today. */
  now?: number;
}

// Drawing space; the SVG stretches to the card, labels are HTML so they never distort.
const W = 1000;
const H = 300;
const TOP = 40;
const BOTTOM = 210;
const BARS = 300;

/** Temperature line over the day, with the chance of rain as bars underneath. */
export default function DayChart({ hours, indices, start, end, timezone, now }: Props) {
  const x = (t: number) => ((t - start) / (end - start)) * W;
  const points = indices.flatMap((i) => {
    const t = hours.temperature[i];
    return t == null ? [] : [{ time: hours.time[i], temp: t }];
  });
  const temps = present(points.map((p) => p.temp));
  if (temps.length < 2) {
    return <p className="card-note">Sem previsão por hora para este dia.</p>;
  }

  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = Math.max(4, hi - lo);
  const mid = (hi + lo) / 2;
  const y = (t: number) => BOTTOM - ((t - (mid - span / 2)) / span) * (BOTTOM - TOP);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(p.time)},${y(p.temp)}`).join(" ");
  const area = `${line} L${x(points.at(-1)!.time)},${BOTTOM} L${x(points[0].time)},${BOTTOM} Z`;
  const hottest = points.find((p) => p.temp === hi)!;
  const coldest = points.find((p) => p.temp === lo)!;
  const step = (end - start) / indices.length;
  const ticks = [0, 6, 12, 18].map((h) => start + h * 3600);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div className="day-chart">
      <div className="day-chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient
              id="day-line"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2={W}
              y1="0"
              y2="0"
            >
              {points.map((p) => (
                <stop key={p.time} offset={x(p.time) / W} stopColor={temperatureColor(p.temp)} />
              ))}
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1={x(t)} x2={x(t)} y1={TOP - 20} y2={BARS} className="day-chart-grid" />
          ))}
          {indices.map((i) => {
            const prob = hours.precipitationProbability[i];
            if (!prob) return null;
            const h = (prob / 100) * (BARS - BOTTOM - 14);
            return (
              <rect
                key={hours.time[i]}
                x={x(hours.time[i]) + 4}
                width={Math.max(2, (step / (end - start)) * W - 8)}
                y={BARS - h}
                height={h}
                className="day-chart-bar"
              />
            );
          })}
          <path d={area} className="day-chart-area" />
          <path d={line} stroke="url(#day-line)" className="day-chart-line" />
          {now != null && now >= start && now < end && (
            <line x1={x(now)} x2={x(now)} y1={TOP - 20} y2={BOTTOM} className="day-chart-now" />
          )}
        </svg>
        {[hottest, coldest].map((p, i) => (
          <span
            key={i}
            className="day-chart-label"
            style={{ left: pct(x(p.time), W), top: pct(y(p.temp) + (i ? 14 : -46), H) }}
          >
            {formatTemp(p.temp)}
          </span>
        ))}
      </div>
      <div className="day-chart-ticks" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className="day-chart-tick" style={{ left: pct(x(t), W) }}>
            {formatHour(t, timezone)}
          </span>
        ))}
      </div>
      <p className="day-chart-legend">
        <span className="day-chart-swatch" aria-hidden /> Chance de chuva por hora
      </p>
    </div>
  );
}
