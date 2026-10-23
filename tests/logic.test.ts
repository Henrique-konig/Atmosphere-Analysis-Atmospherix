import { describe, expect, it } from "vitest";
import { averageForDate } from "@/lib/averages";
import { aqiAt, aqiRange } from "@/lib/airquality";
import { aqiLevel, describeWeather, pressureTrend, uvLevel, uvTone } from "@/lib/conditions";
import {
  compassPoint,
  formatHour,
  formatNumber,
  formatTemp,
  formatTime,
  formatWeekday,
  formatRain,
} from "@/lib/format";
import { daysUntil, moonInfo, SYNODIC_MONTH } from "@/lib/moon";

describe("averageForDate", () => {
  it("averages the days within the window across years", () => {
    const dates = ["2020-10-17", "2020-10-19", "2020-10-30", "2021-10-19", "2021-10-22"];
    const max = [20, 22, 40, 24, 26];
    const min = [10, 12, 30, 14, 16];
    expect(averageForDate(dates, max, min, 10, 19)).toEqual({ years: 2, max: 23, min: 13 });
  });

  it("wraps around the new year", () => {
    const avg = averageForDate(["2020-12-30", "2021-01-02"], [30, 32], [20, 22], 1, 1);
    expect(avg).toEqual({ years: 2, max: 31, min: 21 });
  });

  it("returns null without matching data", () => {
    expect(averageForDate(["2020-05-01"], [1], [0], 10, 19)).toBeNull();
    expect(averageForDate(["2020-10-19"], [null], [null], 10, 19)).toBeNull();
  });
});

describe("moonInfo", () => {
  const newMoon = Date.UTC(2000, 0, 6, 18, 14) / 1000;

  it("is new at the reference new moon", () => {
    const m = moonInfo(newMoon);
    expect(m.name).toBe("Lua nova");
    expect(m.illumination).toBeCloseTo(0, 3);
  });

  it("is full half a cycle later", () => {
    const m = moonInfo(newMoon + (SYNODIC_MONTH / 2) * 86_400);
    expect(m.name).toBe("Lua cheia");
    expect(m.illumination).toBeCloseTo(1, 3);
  });

  it("names the gibbous phases", () => {
    expect(moonInfo(newMoon + SYNODIC_MONTH * 0.4 * 86_400).name).toBe("Crescente gibosa");
    expect(moonInfo(newMoon + SYNODIC_MONTH * 0.6 * 86_400).name).toBe("Minguante gibosa");
  });

  it("counts the days to the next full moon", () => {
    expect(moonInfo(newMoon + 86_400 * 5).daysToFull).toBeCloseTo(SYNODIC_MONTH / 2 - 5, 3);
  });

  it("words the days ahead", () => {
    expect(daysUntil(0.3)).toBe("Hoje");
    expect(daysUntil(1.2)).toBe("Amanhã");
    expect(daysUntil(9.6)).toBe("Em 10 dias");
  });
});

describe("conditions", () => {
  it("describes day and night skies", () => {
    expect(describeWeather(0, true)).toMatchObject({ icon: "sun", theme: "clear-day" });
    expect(describeWeather(0, false)).toMatchObject({ icon: "moon", theme: "clear-night" });
    expect(describeWeather(95).theme).toBe("storm");
    expect(describeWeather(63).label).toBe("Chuva");
  });

  it("classifies UV and pressure trend", () => {
    expect(uvLevel(2).label).toBe("Baixo");
    expect(uvLevel(9).label).toBe("Muito alto");
    expect(pressureTrend(1013, 1015)).toBe("subindo");
    expect(pressureTrend(1013, 1013.4)).toBe("estável");
    expect(pressureTrend(1013, 1010)).toBe("caindo");
  });
});

describe("format", () => {
  const t = Date.UTC(2026, 9, 19, 15, 5) / 1000; // Mon 19 Oct 2026, 15:05 UTC

  it("uses the location's time zone", () => {
    expect(formatTime(t, "America/Sao_Paulo")).toBe("12:05");
    expect(formatHour(t, "America/Sao_Paulo")).toBe("12h");
    expect(formatHour(t, "Asia/Tokyo")).toBe("00h");
    expect(formatWeekday(t, "America/Sao_Paulo")).toBe("Seg");
  });

  it("names compass points in Portuguese", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(270)).toBe("O");
    expect(compassPoint(-45)).toBe("NO");
  });

  it("shows missing values as a dash instead of 0", () => {
    expect(formatTemp(null)).toBe("—");
    expect(formatTemp(0)).toBe("0°");
    expect(formatNumber(null, 1)).toBe("—");
    expect(formatNumber(2.345, 1)).toBe("2.3");
  });
});

describe("formatRain", () => {
  it("rounds hourly rain the pt-BR way", () => {
    expect(formatRain(null)).toBe("—");
    expect(formatRain(0)).toBe("0");
    expect(formatRain(0.02)).toBe("0");
    expect(formatRain(0.4)).toBe("0,4");
    expect(formatRain(12.6)).toBe("13");
  });
});

describe("air quality", () => {
  const air = {
    current: { time: 0, aqi: 30, pm25: null, pm10: null, ozone: null, nitrogenDioxide: null },
    hourly: { time: [0, 3600, 7200, 10800], aqi: [30, 120, null, 60] },
  };

  it("uses the US AQI categories", () => {
    expect(aqiLevel(0).label).toBe("Boa");
    expect(aqiLevel(50).tone).toBe("good");
    expect(aqiLevel(51).label).toBe("Moderada");
    expect(aqiLevel(150).tone).toBe("sensitive");
    expect(aqiLevel(180).label).toBe("Ruim");
    expect(aqiLevel(250).tone).toBe("very-unhealthy");
    expect(aqiLevel(400).label).toBe("Perigosa");
  });

  it("finds the AQI of an hour and the range of a day", () => {
    expect(aqiAt(air, 3600)).toBe(120);
    expect(aqiAt(air, 7200)).toBeNull();
    expect(aqiAt(air, 99)).toBeNull();
    expect(aqiAt(null, 0)).toBeNull();
    expect(aqiRange(air, 0, 10800)).toEqual({ min: 30, max: 120 });
    expect(aqiRange(air, 7200, 7300)).toBeNull();
  });

  it("matches the UV colours to the UV levels", () => {
    expect(uvTone(2)).toBe("low");
    expect(uvTone(3)).toBe("moderate");
    expect(uvTone(7)).toBe("high");
    expect(uvTone(10)).toBe("very-high");
    expect(uvTone(11)).toBe("extreme");
  });
});
