import { describe, expect, it } from "vitest";
import { getLayer, LAYERS } from "@/lib/layers";

describe("LAYERS", () => {
  it("has unique ids and variables", () => {
    expect(new Set(LAYERS.map((l) => l.id)).size).toBe(LAYERS.length);
    expect(new Set(LAYERS.map((l) => l.variable)).size).toBe(LAYERS.length);
  });

  it.each(LAYERS)("$id has ascending stops and legend ticks inside its scale", (layer) => {
    const values = layer.scale.map(([v]) => v);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    for (const tick of layer.ticks) {
      expect(tick).toBeGreaterThanOrEqual(values[0]);
      expect(tick).toBeLessThanOrEqual(values[values.length - 1]);
    }
  });

  it("looks layers up by id", () => {
    expect(getLayer("pressure").variable).toBe("pressure_msl");
  });
});
