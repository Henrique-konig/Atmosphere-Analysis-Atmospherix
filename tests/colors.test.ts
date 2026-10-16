import { describe, expect, it } from "vitest";
import { colorAt, type ColorStop } from "@/lib/colors";
import { renderField, sampleBilinear } from "@/lib/raster";

const scale: ColorStop[] = [
  [0, [0, 0, 0, 255]],
  [10, [100, 200, 50, 255]],
];

describe("colorAt", () => {
  it("interpolates between stops", () => {
    expect(colorAt(scale, 5)).toEqual([50, 100, 25, 255]);
  });

  it("clamps values outside the scale", () => {
    expect(colorAt(scale, -5)).toEqual([0, 0, 0, 255]);
    expect(colorAt(scale, 50)).toEqual([100, 200, 50, 255]);
  });

  it("is transparent for missing values", () => {
    expect(colorAt(scale, NaN)).toEqual([0, 0, 0, 0]);
  });
});

describe("raster", () => {
  const field = [0, 10, 20, 30]; // 2x2

  it("samples bilinearly", () => {
    expect(sampleBilinear(field, 2, 2, 0.5, 0.5)).toBe(15);
    expect(sampleBilinear(field, 2, 2, 1, 0)).toBe(10);
  });

  it("renders an RGBA buffer of the requested size", () => {
    const pixels = renderField(field, 2, 2, scale, 3, 3);
    expect(pixels).toHaveLength(3 * 3 * 4);
    // Top-left pixel maps to value 0.
    expect(Array.from(pixels.slice(0, 4))).toEqual([0, 0, 0, 255]);
  });
});
