import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { fetchGridForecast, OpenMeteoError } = await import("@/lib/openmeteo");
const { toVelocityData } = await import("@/lib/velocity");

function location(temp: number) {
  return {
    latitude: 0,
    longitude: 0,
    elevation: 0,
    timezone: "GMT",
    hourly: {
      time: [1_700_000_000, 1_700_003_600],
      temperature_2m: [temp, temp + 1],
      precipitation: [0, 1.25],
      cloud_cover: [10, 90],
      wind_gusts_10m: [10, 0],
      pressure_msl: [1013.2, 1010],
      relative_humidity_2m: [55, 60],
      wind_speed_10m: [10, 0],
      wind_direction_10m: [270, 0],
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchGridForecast", () => {
  const grid = { bbox: { north: 1, south: 0, west: 0, east: 1 }, nx: 2, ny: 2 };

  it("reshapes per-location series into per-time fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([location(10), location(11), location(12), location(13)])),
      );
    vi.stubGlobal("fetch", fetchMock);

    const forecast = await fetchGridForecast(grid);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("latitude")).toBe("1,1,0,0");
    expect(url.searchParams.get("longitude")).toBe("0,1,0,1");
    expect(forecast.times).toHaveLength(2);
    expect(forecast.fields.temperature).toEqual([
      [10, 11, 12, 13],
      [11, 12, 13, 14],
    ]);
    expect(forecast.fields.precipitation[1]).toEqual([1.3, 1.3, 1.3, 1.3]);
    expect(forecast.fields.clouds[1][0]).toBe(90);
    expect(forecast.fields.pressure[0][0]).toBe(1013.2);
    expect(forecast.fields.humidity[0][0]).toBe(55);
    // Gusts are requested in m/s and shown in km/h.
    expect(forecast.fields.gusts[0][0]).toBe(36);
    expect(forecast.windU[0][0]).toBeCloseTo(10);
    expect(forecast.windV[0][0]).toBeCloseTo(0);

    const [u, v] = toVelocityData(forecast, 0);
    expect(u.header).toMatchObject({ parameterNumber: 2, nx: 2, ny: 2, la1: 1, lo1: 0 });
    expect(v.header.parameterNumber).toBe(3);
  });

  it("requests every layer variable and tolerates missing ones", async () => {
    const partial = () => {
      const loc = location(10);
      delete (loc.hourly as Record<string, unknown>).cloud_cover;
      return loc;
    };
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify([partial(), partial(), partial(), partial()])),
    );
    vi.stubGlobal("fetch", fetchMock);

    const forecast = await fetchGridForecast(grid);

    const hourly = new URL(String(fetchMock.mock.calls[0])).searchParams.get("hourly")!.split(",");
    expect(hourly).toEqual(
      expect.arrayContaining([
        "cloud_cover",
        "wind_gusts_10m",
        "pressure_msl",
        "relative_humidity_2m",
      ]),
    );
    expect(forecast.fields.clouds[0]).toEqual([0, 0, 0, 0]);
  });

  it("surfaces API errors with the reason given by Open-Meteo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ reason: "Too many locations" }), { status: 400 }),
      ),
    );
    await expect(fetchGridForecast(grid)).rejects.toThrow(OpenMeteoError);
    await expect(fetchGridForecast(grid)).rejects.toThrow(/Too many locations/);
  });
});
