import { describe, expect, it } from "vitest";
import {
  clampGridSize,
  gridPoints,
  gridStep,
  MAX_GRID_SIZE,
  parseBBox,
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
