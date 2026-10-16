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
    expect(forecast.temperature).toEqual([
      [10, 11, 12, 13],
      [11, 12, 13, 14],
    ]);
    expect(forecast.precipitation[1]).toEqual([1.3, 1.3, 1.3, 1.3]);
    expect(forecast.windU[0][0]).toBeCloseTo(10);
    expect(forecast.windV[0][0]).toBeCloseTo(0);

    const [u, v] = toVelocityData(forecast, 0);
    expect(u.header).toMatchObject({ parameterNumber: 2, nx: 2, ny: 2, la1: 1, lo1: 0 });
    expect(v.header.parameterNumber).toBe(3);
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
