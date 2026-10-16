import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { searchPlaces } = await import("@/lib/geocoding");
const { placeDetails } = await import("@/lib/places");

afterEach(() => vi.unstubAllGlobals());

describe("searchPlaces", () => {
  it("maps Open-Meteo results to places", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: 3452925,
                name: "Porto Alegre",
                latitude: -30.03,
                longitude: -51.23,
                admin1: "Rio Grande do Sul",
                country: "Brasil",
                country_code: "BR",
              },
            ],
          }),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const places = await searchPlaces("porto alegre");

    const url = new URL(String(fetchMock.mock.calls[0]));
    expect(url.searchParams.get("name")).toBe("porto alegre");
    expect(url.searchParams.get("language")).toBe("pt");
    expect(places).toEqual([
      {
        id: 3452925,
        name: "Porto Alegre",
        region: "Rio Grande do Sul",
        country: "Brasil",
        countryCode: "BR",
        latitude: -30.03,
        longitude: -51.23,
      },
    ]);
  });

  it("returns an empty list when nothing matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({}))),
    );
    expect(await searchPlaces("xyzxyz")).toEqual([]);
  });
});

describe("placeDetails", () => {
  const base = { id: 1, latitude: 0, longitude: 0 };

  it("joins region and country", () => {
    expect(
      placeDetails({ ...base, name: "Pelotas", region: "Rio Grande do Sul", country: "Brasil" }),
    ).toBe("Rio Grande do Sul, Brasil");
  });

  it("skips blanks and parts equal to the name", () => {
    expect(
      placeDetails({ ...base, name: "Singapura", region: "Singapura", country: "Singapura" }),
    ).toBe("");
    expect(placeDetails({ ...base, name: "Lugar", country: "Brasil" })).toBe("Brasil");
  });
});
