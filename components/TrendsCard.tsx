"use client";

import { ArrowUp, ChartLine } from "lucide-react";
import { useRef, useState } from "react";
import { chartData, linePath, niceScale, type Metric, type Period } from "@/lib/charts";
import {
  compassPoint,
  formatDayOfMonth,
  formatHour,
  formatNumber,
  formatRain,
  formatTemp,
  formatWeekday,
  MISSING,
  present,
} from "@/lib/format";
import type { Forecast } from "@/lib/types";
import Card from "./Card";

// Drawing space; the SVG stretches to the card, labels are HTML so they never distort.
const W = 1000;
const H = 200;
const TOP = 14;
const BOTTOM = 196;

const METRICS: { id: Metric; label: string }[] = [
  { id: "temperature", label: "Temperatura" },
  { id: "rain", label: "Chuva" },
  { id: "wind", label: "Vento" },
];

/** Local hour of a timestamp, 0–23. */
const localHour = (t: number, tz: string) => Number.parseInt(formatHour(t, tz), 10);
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const kmh = (v: number | null) => (v == null ? MISSING : `${Math.round(v)} km/h`);
const chance = (v: number | null) => (v == null ? "" : ` · ${Math.round(v)}% de chance`);

/** Temperature, rain and wind as charts, for the next 48 hours or the forecast days. */
export default function TrendsCard({ forecast }: { forecast: Forecast }) {
  const [metric, setMetric] = useState<Metric>("temperature");
  const [period, setPeriod] = useState<Period>("days");
  const [selected, setSelected] = useState(0);
  const plot = useRef<HTMLDivElement>(null);

  const { timezone, hourly, daily } = forecast;
  const data = chartData(forecast, metric, period);
  const n = data.times.length;
  const days = period === "days";
  const sel = Math.min(selected, n - 1);

  const scaled = data.series.filter((s) => !s.percent);
  const values = scaled.flatMap((s) => present(s.values));
  const top = values.length ? Math.max(...values) : 0;
  const scale = data.fromZero
    ? niceScale(0, Math.max(top, metric === "rain" ? 1 : 10))
    : niceScale(Math.min(...values), top);

  const x = (i: number) => ((i + 0.5) / n) * W;
  const y = (v: number) => BOTTOM - ((v - scale.lo) / (scale.hi - scale.lo)) * (BOTTOM - TOP);
  const yPercent = (v: number) => BOTTOM - (v / 100) * (BOTTOM - TOP);

  const dayLabel = (i: number) => (i === 0 ? "Hoje" : formatWeekday(data.times[i], timezone));
  const pointLabel = (i: number) =>
    days
      ? dayLabel(i)
      : i === 0
        ? "Agora"
        : formatDayOfMonth(data.times[i], timezone) === formatDayOfMonth(data.times[0], timezone)
          ? formatHour(data.times[i], timezone)
          : `${formatWeekday(data.times[i], timezone)}, ${formatHour(data.times[i], timezone)}`;

  const ticks = data.times.flatMap((t, i) => {
    if (days) return [{ i, label: dayLabel(i) }];
    const hour = localHour(t, timezone);
    if (hour % 6 !== 0) return [];
    return [{ i, label: hour === 0 ? formatWeekday(t, timezone) : formatHour(t, timezone) }];
  });
  const arrows = data.directions
    ? data.times.flatMap((t, i) =>
        days || localHour(t, timezone) % 3 === 0 ? [{ i, deg: data.directions![i] }] : [],
      )
    : [];

  function readout(i: number): string {
    const when =
      days && i > 0
        ? `${dayLabel(i)}, ${formatDayOfMonth(data.times[i], timezone)}`
        : pointLabel(i);
    if (metric === "temperature") {
      return days
        ? `${when} · máx. ${formatTemp(daily.temperatureMax[i])} · mín. ${formatTemp(daily.temperatureMin[i])}`
        : `${when} · ${formatTemp(hourly.temperature[i])} · sensação ${formatTemp(hourly.apparentTemperature[i])}`;
    }
    if (metric === "rain") {
      const mm = days ? daily.precipitationSum[i] : hourly.precipitation[i];
      const prob = days ? daily.precipitationProbabilityMax[i] : hourly.precipitationProbability[i];
      return `${when} · ${formatRain(mm)}${mm == null ? "" : " mm"}${chance(prob)}`;
    }
    const [speed, gusts] = data.series.map((s) => s.values[i]);
    const dir = data.directions?.[i];
    return `${when} · ${kmh(speed)}${dir == null ? "" : ` ${compassPoint(dir)}`} · rajadas ${kmh(gusts)}`;
  }

  function pick(clientX: number) {
    const rect = plot.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const i = Math.floor(((clientX - rect.left) / rect.width) * n);
    setSelected(Math.max(0, Math.min(n - 1, i)));
  }

  // Values written over the chart: only for the days, where there is room for each one.
  const labels = days
    ? data.series.flatMap((s, k) => {
        if (s.percent || (metric === "wind" && k > 0)) return [];
        const below = metric === "temperature" && k === 1;
        return s.values.flatMap((v, i) => {
          if (v == null || (s.kind === "bar" && v < 0.05)) return [];
          const text =
            metric === "temperature"
              ? formatTemp(v)
              : metric === "rain"
                ? formatRain(v)
                : formatNumber(v);
          return [{ key: `${k}-${i}`, i, v, text, below }];
        });
      })
    : [];

  const barWidth = (W / n) * (days ? 0.56 : 0.7);
  const dry = metric === "rain" && top < 0.05;

  return (
    <Card title="Gráficos" icon={ChartLine} className="trends">
      <div className="trends-controls">
        <div className="segmented" role="group" aria-label="Gráfico">
          {METRICS.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={metric === m.id}
              onClick={() => setMetric(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Período">
          {(
            [
              ["hours", `${hourly.time.length} h`],
              ["days", `${daily.time.length} dias`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => {
                setPeriod(id);
                setSelected(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {values.length === 0 ? (
        <p className="card-note">Sem dados para este gráfico.</p>
      ) : (
        <>
          <p className="trends-readout" aria-live="polite">
            {readout(sel)}
          </p>
          <div className="trends-chart">
            <div className="trends-axis" aria-hidden>
              {scale.ticks.map((v) => (
                <span key={v} style={{ top: pct(y(v), H) }}>
                  {formatNumber(v, Number.isInteger(v) ? 0 : 1).replace(".", ",")}
                </span>
              ))}
            </div>
            <div
              ref={plot}
              className="trends-plot"
              role="img"
              tabIndex={0}
              aria-label={`Gráfico de ${METRICS.find((m) => m.id === metric)!.label.toLowerCase()}. Use as setas para percorrer.`}
              onPointerDown={(e) => pick(e.clientX)}
              onPointerMove={(e) => {
                if (e.pointerType === "mouse" || e.buttons) pick(e.clientX);
              }}
              onKeyDown={(e) => {
                const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                if (!step) return;
                e.preventDefault();
                setSelected(Math.max(0, Math.min(n - 1, sel + step)));
              }}
            >
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
                {scale.ticks.map((v) => (
                  <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} className="trends-grid" />
                ))}
                {!days &&
                  ticks.map(({ i }) => (
                    <line
                      key={i}
                      x1={x(i)}
                      x2={x(i)}
                      y1={TOP}
                      y2={BOTTOM}
                      className="trends-grid"
                    />
                  ))}
                <line x1={x(sel)} x2={x(sel)} y1={0} y2={BOTTOM} className="trends-cursor" />
                {data.series.map((s) =>
                  s.kind === "bar" ? (
                    <g key={s.label} className={s.tone}>
                      {s.values.map((v, i) =>
                        v == null || v < 0.05 ? null : (
                          <rect
                            key={i}
                            x={x(i) - barWidth / 2}
                            width={barWidth}
                            y={y(v)}
                            height={BOTTOM - y(v)}
                            rx={days ? 4 : 1}
                            className="trends-bar"
                          />
                        ),
                      )}
                    </g>
                  ) : (
                    <path
                      key={s.label}
                      d={linePath(s.values, x, s.percent ? yPercent : y)}
                      className={`trends-line ${s.tone}${s.dashed ? " dashed" : ""}`}
                    />
                  ),
                )}
              </svg>
              {data.series.map((s) => {
                const v = s.values[sel];
                if (s.kind === "bar" || v == null) return null;
                return (
                  <span
                    key={s.label}
                    className={`trends-dot ${s.tone}`}
                    style={{ left: pct(x(sel), W), top: pct(s.percent ? yPercent(v) : y(v), H) }}
                  />
                );
              })}
              {labels.map((l) => (
                <span
                  key={l.key}
                  className={`trends-value${l.below ? " below" : ""}`}
                  style={{ left: pct(x(l.i), W), top: pct(y(l.v), H) }}
                >
                  {l.text}
                </span>
              ))}
            </div>
            <div className="trends-ticks" aria-hidden>
              {ticks.map(({ i, label }) => (
                <span
                  key={i}
                  className={i === sel && days ? "selected" : undefined}
                  style={{ left: pct(x(i), W) }}
                >
                  {label}
                </span>
              ))}
            </div>
            {arrows.length > 0 && (
              <div className="trends-arrows" aria-hidden>
                {arrows.map(({ i, deg }) =>
                  deg == null ? null : (
                    <ArrowUp
                      key={i}
                      size={13}
                      strokeWidth={2.5}
                      style={{
                        left: pct(x(i), W),
                        transform: `translateX(-50%) rotate(${deg + 180}deg)`,
                      }}
                    />
                  ),
                )}
              </div>
            )}
          </div>
          <ul className="trends-legend">
            {data.series.map((s) => (
              <li key={s.label}>
                <span
                  className={`trends-swatch ${s.tone}${s.kind === "bar" ? " bar" : ""}${s.dashed ? " dashed" : ""}`}
                  aria-hidden
                />
                {s.label}
                {s.percent ? " (%)" : ` (${data.unit.trim()})`}
              </li>
            ))}
            {arrows.length > 0 && (
              <li>
                <ArrowUp size={12} strokeWidth={2.5} aria-hidden /> Para onde o vento sopra
              </li>
            )}
          </ul>
          {dry && <p className="card-note">Sem chuva prevista no período.</p>}
        </>
      )}
    </Card>
  );
}
