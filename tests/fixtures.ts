import type { Forecast } from "@/lib/types";

/** A calm 48-hour forecast; override fields to build scenarios. */
export function calmForecast(
  overrides: { hourly?: object; daily?: object; dayHours?: object } = {},
): Forecast {
  const start = Date.UTC(2026, 9, 19, 12) / 1000;
  const hours = 48;
  const fill = (v: number) => Array.from({ length: hours }, () => v);
  const days = 10;
  const dfill = (v: number) => Array.from({ length: days }, () => v);
  const hourly = {
    time: Array.from({ length: hours }, (_, i) => start + i * 3600),
    temperature: fill(22),
    apparentTemperature: fill(22),
    humidity: fill(60),
    dewPoint: fill(14),
    precipitationProbability: fill(0),
    precipitation: fill(0),
    weatherCode: fill(1),
    pressure: fill(1015),
    visibility: fill(24_000),
    windSpeed: fill(10),
    windDirection: fill(90),
    windGusts: fill(20),
    uvIndex: fill(3),
    isDay: Array.from({ length: hours }, () => true),
  };
  return {
    latitude: -30,
    longitude: -51,
    elevation: 10,
    timezone: "America/Sao_Paulo",
    current: {
      time: start,
      temperature: 22,
      apparentTemperature: 22,
      humidity: 60,
      dewPoint: 14,
      precipitation: 0,
      weatherCode: 1,
      isDay: true,
      cloudCover: 20,
      pressure: 1015,
      windSpeed: 10,
      windDirection: 90,
      windGusts: 20,
      visibility: 24_000,
      uvIndex: 5,
    },
    hourly: { ...hourly, ...overrides.hourly },
    dayHours: { ...hourly, ...overrides.dayHours },
    daily: {
      time: Array.from({ length: days }, (_, i) => start + i * 86_400),
      weatherCode: dfill(1),
      temperatureMax: dfill(26),
      temperatureMin: dfill(15),
      sunrise: dfill(start - 6 * 3600),
      sunset: dfill(start + 7 * 3600),
      daylightDuration: dfill(13 * 3600),
      uvIndexMax: dfill(6),
      precipitationSum: dfill(0),
      precipitationProbabilityMax: dfill(0),
      windSpeedMax: dfill(15),
      windGustsMax: dfill(30),
      windDirectionDominant: dfill(90),
      ...overrides.daily,
    },
  };
}
