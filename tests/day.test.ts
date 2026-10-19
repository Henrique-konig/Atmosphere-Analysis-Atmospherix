import { describe, expect, it } from "vitest";
import { dayDetails, daySummary } from "@/lib/day";
import { parseCoordinateList } from "@/lib/grid";
import { calmForecast } from "./fixtures";

/** 72 hours from local midnight in São Paulo (UTC-3). */
function threeDays() {
  const midnight = Date.UTC(2026, 9, 19, 3) / 1000;
  const time = Array.from({ length: 72 }, (_, i) => midnight + i * 3600);
  // Warmest at 15h on every day.
  const temperature = time.map((_, i) => 20 - Math.abs((i % 24) - 15));
  return calmForecast({
    dayHours: {
      time,
      temperature,
      apparentTemperature: time.map((_, i) => (i < 24 ? 18 + (i % 24) / 4 : 25)),
      humidity: time.map((_, i) => 50 + (i % 24)),
      pressure: time.map(() => 1012),
    },
    daily: {
      time: [0, 1, 2].map((d) => midnight + d * 86_400),
      precipitationProbabilityMax: [70, 10, null],
      precipitationSum: [4.2, 0, null],
      windGustsMax: [62, 30, null],
    },
  });
}

describe("dayDetails", () => {
  it("picks the 24 hours of the chosen day", () => {
    const f = threeDays();
    const d = dayDetails(f, 1);
    expect(d.hours).toHaveLength(24);
    expect(f.dayHours.time[d.hours[0]]).toBe(d.start);
    expect(d.end - d.start).toBe(86_400);
  });

  it("summarises the hours of the day", () => {
    const d = dayDetails(threeDays(), 0);
    expect(d.feelsLike).toEqual({ min: 18, max: 23.75 });
    expect(d.humidity).toEqual({ min: 50, max: 73 });
    expect(d.pressure).toEqual({ min: 1012, max: 1012 });
    expect(d.warmestHour).toBe(d.start + 15 * 3600);
  });

  it("has no hours past the end of the hourly data", () => {
    const f = threeDays();
    f.daily.time.push(f.daily.time[2] + 86_400);
    const d = dayDetails(f, 3);
    expect(d.hours).toEqual([]);
    expect(d.feelsLike).toBeNull();
    expect(d.warmestHour).toBeNull();
  });
});

describe("daySummary", () => {
  it("mentions rain and strong gusts", () => {
    const f = threeDays();
    const text = daySummary(dayDetails(f, 0), f.timezone);
    expect(text).toContain("por volta das 15h");
    expect(text).toContain("Chance de chuva de 70%, com cerca de 4 mm no total.");
    expect(text).toContain("Rajadas de vento de até 62 km/h.");
  });

  it("says when no rain is expected", () => {
    const f = threeDays();
    expect(daySummary(dayDetails(f, 1), f.timezone)).toContain("Sem chuva prevista.");
  });

  it("leaves rain out when it is unknown", () => {
    const f = threeDays();
    expect(daySummary(dayDetails(f, 2), f.timezone)).not.toMatch(/chuva/i);
  });
});

describe("parseCoordinateList", () => {
  const parse = (q: string) => parseCoordinateList(new URLSearchParams(q), 3);

  it("reads matching lists of coordinates", () => {
    expect(parse("lat=-30,38.7&lon=-51,-9.1")).toEqual([
      { lat: -30, lon: -51 },
      { lat: 38.7, lon: -9.1 },
    ]);
  });

  it("rejects mismatched, invalid or too many points", () => {
    expect(parse("lat=1,2&lon=3")).toBeNull();
    expect(parse("lat=91&lon=0")).toBeNull();
    expect(parse("lat=1,2,3,4&lon=1,2,3,4")).toBeNull();
    expect(parse("lat=&lon=")).toBeNull();
  });
});
