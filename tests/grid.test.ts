import { describe, expect, it } from "vitest";
import {
  bboxCovers,
  clampGridSize,
  gridPoints,
  gridStep,
  MAX_GRID_SIZE,
  needsReload,
  parseBBox,
  snapBBox,
  windToUV,
} from "@/lib/grid";

describe("gridPoints", () => {
  it("lists points row-major from the north-west corner", () => {
    const points = gridPoints({ bbox: { north: 0, south: -2, west: 10, east: 12 }, nx: 3, ny: 2 });
    expect(points).toEqual([
      { lat: 0, lon: 10 },
      { lat: 0, lon: 11 },
      { lat: 0, lon: 12 },
      { lat: -2, lon: 10 },
      { lat: -2, lon: 11 },
      { lat: -2, lon: 12 },
    ]);
  });

  it("computes the spacing between points", () => {
    expect(gridStep({ bbox: { north: 10, south: 0, west: 0, east: 20 }, nx: 5, ny: 3 })).toEqual({
      dx: 5,
      dy: 5,
    });
  });
});

describe("windToUV", () => {
  it("turns a northerly wind (from 0°) into a southward vector", () => {
    const { u, v } = windToUV(10, 0);
    expect(u).toBeCloseTo(0);
    expect(v).toBeCloseTo(-10);
  });

  it("turns a westerly wind (from 270°) into an eastward vector", () => {
    const { u, v } = windToUV(5, 270);
    expect(u).toBeCloseTo(5);
    expect(v).toBeCloseTo(0);
  });
});

describe("parseBBox", () => {
  it("accepts a valid box", () => {
    const params = new URLSearchParams({ north: "-20", south: "-30", west: "-55", east: "-45" });
    expect(parseBBox(params)).toEqual({ north: -20, south: -30, west: -55, east: -45 });
  });

  it.each([
    { north: "-30", south: "-20", west: "-55", east: "-45" },
    { north: "-20", south: "-30", west: "-45", east: "-55" },
    { north: "95", south: "-30", west: "-55", east: "-45" },
    { north: "abc", south: "-30", west: "-55", east: "-45" },
  ])("rejects %o", (box) => {
    expect(parseBBox(new URLSearchParams(box))).toBeNull();
  });
});

describe("clampGridSize", () => {
  it("caps the size to keep the Open-Meteo quota in check", () => {
    expect(clampGridSize("500")).toBe(MAX_GRID_SIZE);
    expect(clampGridSize("8")).toBe(8);
    expect(clampGridSize(null)).toBeGreaterThan(1);
    expect(clampGridSize("1")).toBeGreaterThan(1);
  });
});

describe("snapBBox", () => {
  it("expands a regional view outward to whole degrees", () => {
    expect(snapBBox({ north: -27.3, south: -31.6, west: -53.8, east: -48.2 })).toEqual({
      north: -27,
      south: -32,
      west: -54,
      east: -48,
    });
  });

  it("uses a coarser lattice for wide views so nearby views share the cache", () => {
    const a = snapBBox({ north: -10.2, south: -40.1, west: -70.4, east: -30.3 });
    const b = snapBBox({ north: -11, south: -41, west: -71, east: -31 });
    expect(a).toEqual({ north: -10, south: -45, west: -75, east: -30 });
    expect(b).toEqual(a);
  });

  it("clamps to valid coordinates", () => {
    expect(snapBBox({ north: 89, south: -89, west: -200, east: 200 })).toEqual({
      north: 85,
      south: -85,
      west: -180,
      east: 180,
    });
  });
});

describe("needsReload", () => {
  const loaded = { north: 0, south: -20, west: -60, east: -40 };

  it("reloads when nothing is loaded yet", () => {
    expect(needsReload(null, loaded)).toBe(true);
  });

  it("keeps the data while the view stays inside it", () => {
    expect(needsReload(loaded, { north: -2, south: -15, west: -58, east: -45 })).toBe(false);
  });

  it("reloads when the view leaves the loaded area", () => {
    expect(needsReload(loaded, { north: 5, south: -15, west: -58, east: -45 })).toBe(true);
  });

  it("reloads when zoomed so far in that the grid would look coarse", () => {
    expect(needsReload(loaded, { north: -9, south: -11, west: -51, east: -49 })).toBe(true);
  });

  it("detects coverage", () => {
    expect(bboxCovers(loaded, loaded)).toBe(true);
    expect(bboxCovers(loaded, { ...loaded, east: -39 })).toBe(false);
  });
});
