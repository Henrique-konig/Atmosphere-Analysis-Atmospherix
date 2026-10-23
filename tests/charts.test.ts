import { describe, expect, it } from "vitest";
import { chartData, linePath, niceScale } from "@/lib/charts";
import { calmForecast } from "./fixtures";

describe("niceScale", () => {
  it("rounds the range out to whole steps", () => {
    expect(niceScale(13.4, 27.8)).toEqual({ lo: 10, hi: 30, ticks: [10, 15, 20, 25, 30] });
  });

  it("uses small steps for small values", () => {
    expect(niceScale(0, 1.3)).toEqual({ lo: 0, hi: 1.5, ticks: [0, 0.5, 1, 1.5] });
  });

  it("widens a flat series", () => {
    const { lo, hi } = niceScale(20, 20);
    expect(lo).toBeLessThan(20);
    expect(hi).toBeGreaterThan(20);
  });
});

describe("linePath", () => {
  it("breaks the line where a value is missing", () => {
    const path = linePath(
      [1, 2, null, 4],
      (i) => i * 10,
      (v) => v,
    );
    expect(path).toBe("M0,1 L10,2 M30,4");
  });

  it("is empty with no values", () => {
    expect(
      linePath(
        [null, null],
        (i) => i,
        (v) => v,
      ),
    ).toBe("");
  });
});

describe("chartData", () => {
  const forecast = calmForecast();

  it("shows the days' maximum and minimum", () => {
    const data = chartData(forecast, "temperature", "days");
    expect(data.times).toBe(forecast.daily.time);
    expect(data.series.map((s) => s.values)).toEqual([
      forecast.daily.temperatureMax,
      forecast.daily.temperatureMin,
    ]);
    expect(data.fromZero).toBe(false);
  });

  it("puts the chance of rain on its own percent scale", () => {
    const data = chartData(forecast, "rain", "hours");
    expect(data.times).toBe(forecast.hourly.time);
    expect(data.series[0]).toMatchObject({ kind: "bar", values: forecast.hourly.precipitation });
    expect(data.series[1]).toMatchObject({ percent: true });
    expect(data.fromZero).toBe(true);
  });

  it("carries the wind direction for the arrows", () => {
    const data = chartData(forecast, "wind", "days");
    expect(data.directions).toBe(forecast.daily.windDirectionDominant);
    expect(data.series[1].values).toEqual(forecast.daily.windGustsMax);
  });
});
