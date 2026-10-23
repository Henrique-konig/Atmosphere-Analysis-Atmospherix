"use client";

import {
  CalendarDays,
  Clock,
  Droplet,
  Gauge,
  Leaf,
  Sun,
  Sunrise,
  Thermometer,
  Umbrella,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { aqiAt, aqiRange } from "@/lib/airquality";
import { aqiLevel, describeWeather, uvLevel } from "@/lib/conditions";
import { dayDetails, daySummary } from "@/lib/day";
import {
  compassPoint,
  formatDayOfMonth,
  formatDuration,
  formatHour,
  formatLongDate,
  formatNumber,
  formatTemp,
  formatTime,
  formatWeekday,
  MISSING,
} from "@/lib/format";
import type { AirQuality, Forecast } from "@/lib/types";
import Card from "./Card";
import DayChart from "./DayChart";
import HourDetails from "./HourDetails";
import ScrollStrip from "./ScrollStrip";
import WeatherIcon from "./WeatherIcon";

interface Props {
  forecast: Forecast;
  airQuality: AirQuality | null;
  /** Index into the daily forecast, or null when closed. */
  day: number | null;
  onSelectDay: (day: number) => void;
  onClose: () => void;
}

const SWIPE_MIN = 60;

const fromTo = (lo: number, hi: number, unit: string) =>
  Math.round(lo) === Math.round(hi)
    ? `${Math.round(lo)}${unit}`
    : `${Math.round(lo)}–${Math.round(hi)}${unit}`;

/** Full-screen details of one forecast day, like tapping a day in the iPhone Weather app. */
export default function DaySheet({ forecast, airQuality, day, onSelectDay, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const open = day !== null;
  const { daily, dayHours, timezone, current } = forecast;
  const count = daily.time.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (day === null) return;
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-day="${day}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [day]);

  const d = day === null ? null : dayDetails(forecast, day);
  const isToday = day === 0;
  const air = d ? aqiRange(airQuality, d.start, d.end) : null;

  return (
    <dialog
      ref={dialogRef}
      className={`sheet day-sheet theme-${describeWeather(d?.weatherCode ?? null).theme}`}
      aria-label="Previsão do dia"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      onKeyDown={(e) => {
        if (day === null) return;
        if (e.key === "ArrowRight" && day < count - 1) onSelectDay(day + 1);
        if (e.key === "ArrowLeft" && day > 0) onSelectDay(day - 1);
      }}
      onTouchStart={(e) => {
        // Swipes that start on a scrollable strip belong to that strip.
        const scrolls = (e.target as HTMLElement).closest(".hourly-strip, .day-strip");
        touch.current = scrolls ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start || day === null) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0 && day < count - 1) onSelectDay(day + 1);
        if (dx > 0 && day > 0) onSelectDay(day - 1);
      }}
    >
      {d && day !== null && (
        <div className="sheet-body">
          <header className="sheet-header">
            <h2>
              <CalendarDays size={20} aria-hidden /> Previsão do dia
            </h2>
            <button type="button" className="round-button" onClick={onClose} aria-label="Fechar">
              <X size={18} aria-hidden />
            </button>
          </header>

          <ol ref={stripRef} className="day-strip" aria-label="Escolher dia">
            {daily.time.map((time, i) => (
              <li key={time}>
                <button
                  type="button"
                  data-day={i}
                  className={i === day ? "selected" : ""}
                  aria-current={i === day ? "date" : undefined}
                  onClick={() => onSelectDay(i)}
                >
                  <span>{i === 0 ? "Hoje" : formatWeekday(time, timezone)}</span>
                  <strong>{formatDayOfMonth(time, timezone)}</strong>
                </button>
              </li>
            ))}
          </ol>

          <section className="day-head" aria-live="polite">
            <p className="day-date">{formatLongDate(d.start, timezone)}</p>
            <div className="day-head-row">
              <WeatherIcon kind={describeWeather(d.weatherCode).icon} size={44} />
              <div>
                <p className="day-condition">{describeWeather(d.weatherCode).label}</p>
                <p className="day-range">
                  Máx.: {formatTemp(d.max)} · Mín.: {formatTemp(d.min)}
                </p>
              </div>
            </div>
            <p className="day-summary">{daySummary(d, timezone)}</p>
          </section>

          <Card title="Temperatura ao longo do dia" icon={Thermometer}>
            <DayChart
              hours={dayHours}
              indices={d.hours}
              start={d.start}
              end={d.end}
              timezone={timezone}
              now={isToday ? current.time : undefined}
            />
          </Card>

          <Card title="Hora a hora" icon={Clock} className="hourly">
            {d.hours.length === 0 ? (
              <p className="card-note">Sem previsão por hora para este dia.</p>
            ) : (
              <ScrollStrip
                className="hourly-strip"
                label="Previsão hora a hora"
                startSelector="li:not(.past)"
                resetKey={day}
              >
                {d.hours.map((i) => {
                  const time = dayHours.time[i];
                  const prob = dayHours.precipitationProbability[i];
                  const past = isToday && time + 3600 <= current.time;
                  return (
                    <li key={time} className={past ? "past" : undefined}>
                      <span className="hourly-time">{formatHour(time, timezone)}</span>
                      <span className="hourly-icon">
                        <WeatherIcon
                          kind={describeWeather(dayHours.weatherCode[i], dayHours.isDay[i]).icon}
                          size={26}
                        />
                        {prob != null && prob >= 20 && <span className="hourly-prob">{prob}%</span>}
                      </span>
                      <span className="hourly-temp">{formatTemp(dayHours.temperature[i])}</span>
                      <HourDetails
                        hourly={dayHours}
                        index={i}
                        aqi={airQuality ? aqiAt(airQuality, time) : undefined}
                      />
                    </li>
                  );
                })}
              </ScrollStrip>
            )}
          </Card>

          <div className="day-tiles">
            <Card title="Chuva" icon={Umbrella} className="day-tile">
              <p className="tile-value">
                {formatNumber(
                  d.precipitation,
                  d.precipitation != null && d.precipitation < 10 ? 1 : 0,
                )}{" "}
                {d.precipitation != null && <small>mm</small>}
              </p>
              <p className="tile-text">
                {d.precipitationProbability == null
                  ? "Chance de chuva indisponível."
                  : `Chance de chuva de ${d.precipitationProbability}%.`}
              </p>
            </Card>
            <Card title="Sensação" icon={Thermometer} className="day-tile">
              <p className="tile-value">
                {d.feelsLike ? fromTo(d.feelsLike.min, d.feelsLike.max, "°") : MISSING}
              </p>
              <p className="tile-text">Sensação térmica mínima e máxima.</p>
            </Card>
            <Card title="Vento" icon={Wind} className="day-tile">
              <p className="tile-value">
                {formatNumber(d.windMax)} {d.windMax != null && <small>km/h</small>}
              </p>
              <p className="tile-text">
                {d.gustsMax != null && `Rajadas de até ${Math.round(d.gustsMax)} km/h. `}
                {d.windDirection != null && `Vindo de ${compassPoint(d.windDirection)}.`}
              </p>
            </Card>
            <Card title="Índice UV" icon={Sun} className="day-tile">
              <p className="tile-value">{formatNumber(d.uvMax)}</p>
              <p className="tile-text">
                {d.uvMax == null
                  ? "Índice máximo do dia."
                  : `Máximo ${uvLevel(d.uvMax).label.toLowerCase()}.`}
              </p>
            </Card>
            <Card title="Umidade" icon={Droplet} className="day-tile">
              <p className="tile-value">
                {d.humidity ? fromTo(d.humidity.min, d.humidity.max, "%") : MISSING}
              </p>
              <p className="tile-text">Umidade relativa ao longo do dia.</p>
            </Card>
            <Card title="Pressão" icon={Gauge} className="day-tile">
              <p className="tile-value">
                {d.pressure ? Math.round((d.pressure.min + d.pressure.max) / 2) : MISSING}{" "}
                {d.pressure && <small>hPa</small>}
              </p>
              <p className="tile-text">
                {d.pressure
                  ? `Entre ${Math.round(d.pressure.min)} e ${Math.round(d.pressure.max)} hPa.`
                  : "Pressão média do dia."}
              </p>
            </Card>
            <Card title="Qualidade do ar" icon={Leaf} className="day-tile tile-wide">
              <dl className="wind-rows">
                <div>
                  <dt>Pior momento</dt>
                  <dd>{air ? `${Math.round(air.max)} · ${aqiLevel(air.max).label}` : MISSING}</dd>
                </div>
                <div>
                  <dt>Melhor momento</dt>
                  <dd>{air ? `${Math.round(air.min)} · ${aqiLevel(air.min).label}` : MISSING}</dd>
                </div>
              </dl>
              <p className="tile-text">
                {air
                  ? "Índice de qualidade do ar (escala americana), pelas previsões por hora."
                  : "A previsão de qualidade do ar cobre só os próximos 5 dias."}
              </p>
            </Card>
            <Card title="Sol" icon={Sunrise} className="day-tile tile-wide">
              <dl className="wind-rows">
                <div>
                  <dt>Nascer</dt>
                  <dd>{d.sunrise == null ? MISSING : formatTime(d.sunrise, timezone)}</dd>
                </div>
                <div>
                  <dt>Pôr do sol</dt>
                  <dd>{d.sunset == null ? MISSING : formatTime(d.sunset, timezone)}</dd>
                </div>
                <div>
                  <dt>Duração do dia</dt>
                  <dd>{d.daylight == null ? MISSING : formatDuration(d.daylight)}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}
    </dialog>
  );
}
