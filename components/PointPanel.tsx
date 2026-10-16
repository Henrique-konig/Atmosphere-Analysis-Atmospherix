"use client";

import { usePointForecast } from "@/hooks/usePointForecast";
import type { PointForecast } from "@/lib/types";
import { closestStep, compassPoint, formatDay } from "@/lib/format";
import { describeWeather } from "@/lib/weatherCodes";
import TemperatureChart from "./TemperatureChart";

interface Props {
  point: { lat: number; lon: number };
  onClose: () => void;
}

const HOURS_IN_CHART = 48;

export default function PointPanel({ point, onClose }: Props) {
  const { data, error, loading } = usePointForecast(point);

  return (
    <aside className="panel point-panel" aria-live="polite">
      <header>
        <div>
          <h2>Previsão do ponto</h2>
          <p className="muted">
            {point.lat.toFixed(2)}°, {point.lon.toFixed(2)}°
            {data ? ` · ${Math.round(data.elevation)} m` : ""}
          </p>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
          ✕
        </button>
      </header>

      {loading && !data && <p className="muted">Carregando…</p>}
      {error && <p className="error">{error}</p>}
      {data && <PointDetails data={data} />}
    </aside>
  );
}

function PointDetails({ data }: { data: PointForecast }) {
  const now = closestStep(data.times);
  const current = describeWeather(data.weatherCode[now]);
  const end = Math.min(data.times.length, now + HOURS_IN_CHART);

  const days = dailySummary(data);

  return (
    <>
      <div className="current">
        <span className="current-icon" aria-hidden>
          {current.icon}
        </span>
        <div>
          <strong className="current-temp">{Math.round(data.temperature[now])}°C</strong>
          <p className="muted">
            {current.label} · sensação {Math.round(data.apparentTemperature[now])}°
          </p>
        </div>
      </div>
      <dl className="stats">
        <div>
          <dt>Vento</dt>
          <dd>
            {Math.round(data.windSpeed[now])} km/h {compassPoint(data.windDirection[now])}
          </dd>
        </div>
        <div>
          <dt>Rajadas</dt>
          <dd>{Math.round(data.windGusts[now])} km/h</dd>
        </div>
        <div>
          <dt>Chuva</dt>
          <dd>
            {data.precipitation[now]} mm · {data.precipitationProbability[now] ?? 0}%
          </dd>
        </div>
      </dl>

      <h3>Próximas {HOURS_IN_CHART}h</h3>
      <TemperatureChart
        times={data.times.slice(now, end)}
        temperature={data.temperature.slice(now, end)}
        precipitation={data.precipitation.slice(now, end)}
      />

      <h3>7 dias</h3>
      <ul className="days">
        {days.map((d) => (
          <li key={d.time}>
            <span>{formatDay(d.time)}</span>
            <span aria-hidden>{describeWeather(d.code).icon}</span>
            <span className="muted">{d.rain.toFixed(1)} mm</span>
            <span>
              <strong>{Math.round(d.max)}°</strong>{" "}
              <span className="muted">{Math.round(d.min)}°</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="muted small">
        Fuso do local: {data.timezone}. Horários exibidos no fuso do seu navegador.
      </p>
    </>
  );
}

/** Groups hourly data into calendar days (24h blocks from the first hour). */
function dailySummary(data: PointForecast) {
  const days: { time: number; min: number; max: number; rain: number; code: number }[] = [];
  for (let start = 0; start < data.times.length; start += 24) {
    const end = Math.min(start + 24, data.times.length);
    const temps = data.temperature.slice(start, end);
    const codes = data.weatherCode.slice(start, end);
    days.push({
      time: data.times[start],
      min: Math.min(...temps),
      max: Math.max(...temps),
      rain: data.precipitation.slice(start, end).reduce((a, b) => a + b, 0),
      code: Math.max(...codes),
    });
  }
  return days;
}
