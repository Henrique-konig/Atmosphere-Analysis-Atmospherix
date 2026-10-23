import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  currentHourIndex,
  fetchAirQuality,
  fetchForecast,
  fetchPrecipitationGrid,
  fetchSummaries,
  fetchTemperatureAverages,
  HOURS_AHEAD,
  OpenMeteoError,
} = await import("@/lib/openmeteo");
const { bboxAround, gridPoints } = await import("@/lib/grid");

afterEach(() => vi.unstubAllGlobals());

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("currentHourIndex", () => {
  it("picks the hour containing now", () => {
    expect(currentHourIndex([0, 3600, 7200], 5000)).toBe(1);
    expect(currentHourIndex([0, 3600, 7200], 0)).toBe(0);
    expect(currentHourIndex([3600, 7200], 0)).toBe(0);
  });
});

describe("fetchForecast", () => {
  const t0 = 1_800_000_000 - (1_800_000_000 % 3600);
  const hours = 72;
  const series = (f: (i: number) => number | null) => Array.from({ length: hours }, (_, i) => f(i));

  const payload = {
    latitude: -30.03,
    longitude: -51.23,
    elevation: 10,
    timezone: "America/Sao_Paulo",
    current: {
      time: t0 + 3 * 3600 + 900,
      temperature_2m: 21.4,
      apparent_temperature: 22,
      relative_humidity_2m: 70,
      precipitation: 0,
      weather_code: 2,
      is_day: 1,
      cloud_cover: 40,
      pressure_msl: 1012,
      wind_speed_10m: 12,
      wind_direction_10m: 180,
      wind_gusts_10m: 25,
    },
    hourly: {
      time: series((i) => t0 + i * 3600),
      temperature_2m: series((i) => 20 + i),
      apparent_temperature: series(() => 21),
      relative_humidity_2m: series(() => 70),
      dew_point_2m: series((i) => 10 + i),
      precipitation_probability: series(() => null),
      precipitation: series(() => 0),
      weather_code: series(() => 2),
      pressure_msl: series(() => 1012),
      visibility: series((i) => 20_000 + i),
      wind_speed_10m: series(() => 12),
      wind_direction_10m: series(() => 180),
      wind_gusts_10m: series(() => 25),
      uv_index: series((i) => i),
      is_day: series((i) => (i % 2 ? 1 : 0)),
    },
    daily: {
      time: [t0],
      weather_code: [2],
      temperature_2m_max: [27],
      temperature_2m_min: [15],
      sunrise: [t0 - 3600],
      sunset: [t0 + 10 * 3600],
      daylight_duration: [12 * 3600],
      uv_index_max: [7],
      precipitation_sum: [null],
      precipitation_probability_max: [10],
      wind_speed_10m_max: [20],
      wind_gusts_10m_max: [40],
      wind_direction_10m_dominant: [170],
    },
  };

  it("trims hourly data to the next 48h from the current hour", async () => {
    const fetchMock = vi.fn(async () => json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const f = await fetchForecast(-30.0333, -51.2333);

    const url = new URL(String(fetchMock.mock.calls[0]));
    expect(url.searchParams.get("latitude")).toBe("-30.033");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(f.hourly.time).toHaveLength(HOURS_AHEAD);
    expect(f.hourly.time[0]).toBe(t0 + 3 * 3600);
    expect(f.hourly.temperature[0]).toBe(23);
    expect(f.hourly.isDay[0]).toBe(true);
    // Missing values stay missing instead of turning into a fake 0.
    expect(f.hourly.precipitationProbability[0]).toBeNull();
    expect(f.daily.precipitationSum).toEqual([null]);
  });

  it("keeps every hour from local midnight for the day details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json(payload)),
    );
    const f = await fetchForecast(0, 0);
    expect(f.dayHours.time).toHaveLength(hours);
    expect(f.dayHours.time[0]).toBe(t0);
    expect(f.dayHours.temperature[5]).toBe(25);
    expect(f.dayHours.isDay[1]).toBe(true);
  });

  it("fills current UV, visibility and dew point from the current hour", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json(payload)),
    );
    const f = await fetchForecast(0, 0);
    expect(f.current).toMatchObject({
      temperature: 21.4,
      isDay: true,
      uvIndex: 3,
      visibility: 20_003,
      dewPoint: 13,
    });
  });

  it("surfaces API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ reason: "Latitude must be in range" }, 400)),
    );
    await expect(fetchForecast(0, 0)).rejects.toThrow(OpenMeteoError);
  });
});

describe("fetchSummaries", () => {
  it("returns one summary per place, in order", async () => {
    const loc = (temp: number, tz: string) => ({
      latitude: 0,
      longitude: 0,
      elevation: 0,
      timezone: tz,
      current: { time: 100, temperature_2m: temp, weather_code: 3, is_day: 0 },
      daily: { time: [0], temperature_2m_max: [temp + 5], temperature_2m_min: [null] },
    });
    const fetchMock = vi.fn(async () =>
      json([loc(20, "America/Sao_Paulo"), loc(5, "Europe/Lisbon")]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const list = await fetchSummaries([
      { lat: -30.0346, lon: -51.2177 },
      { lat: 38.7, lon: -9.1 },
    ]);

    const url = new URL(String(fetchMock.mock.calls[0]));
    expect(url.searchParams.get("latitude")).toBe("-30.035,38.7");
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ temperature: 20, max: 25, min: null, isDay: false });
    expect(list[1].timezone).toBe("Europe/Lisbon");
  });

  it("rejects a response with the wrong number of places", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ latitude: 0, longitude: 0, elevation: 0, timezone: "GMT" })),
    );
    await expect(
      fetchSummaries([
        { lat: 0, lon: 0 },
        { lat: 1, lon: 1 },
      ]),
    ).rejects.toThrow(OpenMeteoError);
  });
});

describe("fetchPrecipitationGrid", () => {
  it("returns precipitation per hour from the current hour", async () => {
    const grid = { bbox: bboxAround(-30, -51, 1), nx: 2, ny: 2 };
    const loc = (mm: number) => ({
      latitude: 0,
      longitude: 0,
      elevation: 0,
      timezone: "GMT",
      hourly: { time: [0, 3600, 7200], precipitation: [mm, mm + 1, null] },
    });
    const fetchMock = vi.fn(async () => json([loc(0), loc(1), loc(2), loc(3)]));
    vi.stubGlobal("fetch", fetchMock);

    const rain = await fetchPrecipitationGrid(grid, 4000);

    const url = new URL(String(fetchMock.mock.calls[0]));
    expect(url.searchParams.get("latitude")!.split(",")).toHaveLength(gridPoints(grid).length);
    expect(rain.times).toEqual([3600, 7200]);
    expect(rain.precipitation).toEqual([
      [1, 2, 3, 4],
      [0, 0, 0, 0],
    ]);
  });
});

describe("fetchTemperatureAverages", () => {
  it("asks for a 7-day window in each of the last 10 years and averages them", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const start = new URL(url).searchParams.get("start_date")!;
      const year = Number(start.slice(0, 4));
      // One failing year must not break the average.
      if (year === 2017) return json({ reason: "boom" }, 500);
      return json({
        daily: { time: [`${year}-10-19`], temperature_2m_max: [24], temperature_2m_min: [14] },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const avg = await fetchTemperatureAverages(-30.03, -51.23, new Date(Date.UTC(2026, 9, 19)));

    const ranges = fetchMock.mock.calls.map(([u]) => {
      const p = new URL(u).searchParams;
      return `${p.get("start_date")}..${p.get("end_date")}`;
    });
    expect(ranges).toHaveLength(10);
    expect(ranges[0]).toBe("2025-10-16..2025-10-22");
    expect(ranges[9]).toBe("2016-10-16..2016-10-22");
    expect(avg).toEqual({ years: 9, max: 24, min: 14 });
  });
});

describe("fetchAirQuality", () => {
  it("maps the current pollutants and the hourly US AQI, keeping gaps as null", async () => {
    const fetchMock = vi.fn(async () =>
      json({
        latitude: 0,
        longitude: 0,
        elevation: 0,
        timezone: "America/Sao_Paulo",
        current: {
          time: 3600,
          us_aqi: 42,
          pm2_5: 8.4,
          pm10: 15,
          ozone: 60,
          nitrogen_dioxide: null,
        },
        hourly: { time: [0, 3600, 7200], us_aqi: [40, 42, null] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const air = await fetchAirQuality(-30.0346, -51.2177);

    const url = new URL(String(fetchMock.mock.calls[0]));
    expect(url.pathname).toBe("/v1/air-quality");
    expect(url.searchParams.get("hourly")).toBe("us_aqi");
    expect(air).toEqual({
      current: { time: 3600, aqi: 42, pm25: 8.4, pm10: 15, ozone: 60, nitrogenDioxide: null },
      hourly: { time: [0, 3600, 7200], aqi: [40, 42, null] },
    });
  });

  it("returns null when the model has nothing for the place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ latitude: 0, longitude: 0, elevation: 0, timezone: "GMT" })),
    );
    expect(await fetchAirQuality(0, 0)).toBeNull();
  });
});

describe("bboxAround", () => {
  it("snaps the centre to a quarter degree", () => {
    expect(bboxAround(-30.03, -51.23, 2)).toEqual({
      north: -29,
      south: -31,
      west: -52.25,
      east: -50.25,
    });
  });
});
