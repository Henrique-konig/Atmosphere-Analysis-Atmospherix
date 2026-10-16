import { formatHour } from "@/lib/format";

interface Props {
  times: number[];
  temperature: number[];
  precipitation: number[];
}

const W = 320;
const H = 120;
const PAD = { top: 14, right: 8, bottom: 20, left: 28 };

/** Lightweight SVG chart: temperature line over precipitation bars. */
export default function TemperatureChart({ times, temperature, precipitation }: Props) {
  if (times.length < 2) return null;
  const min = Math.floor(Math.min(...temperature) - 1);
  const max = Math.ceil(Math.max(...temperature) + 1);
  const maxRain = Math.max(2, ...precipitation);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (times.length - 1)) * innerW;
  const y = (t: number) => PAD.top + (1 - (t - min) / (max - min)) * innerH;
  const path = temperature
    .map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(t).toFixed(1)}`)
    .join("");
  const barW = innerW / times.length;
  const labelEvery = Math.ceil(times.length / 6);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="chart"
      role="img"
      aria-label="Gráfico de temperatura e chuva"
    >
      {precipitation.map((p, i) =>
        p > 0 ? (
          <rect
            key={`r${i}`}
            x={x(i) - barW / 2}
            y={PAD.top + innerH - (p / maxRain) * innerH}
            width={barW * 0.8}
            height={(p / maxRain) * innerH}
            className="chart-rain"
          />
        ) : null,
      )}
      {[min, Math.round((min + max) / 2), max].map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={PAD.left - 4} y={y(t) + 3} textAnchor="end" className="chart-axis">
            {t}°
          </text>
        </g>
      ))}
      <path d={path} className="chart-line" />
      {times.map((t, i) =>
        i % labelEvery === 0 ? (
          <text key={t} x={x(i)} y={H - 5} textAnchor="middle" className="chart-axis">
            {formatHour(t)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
