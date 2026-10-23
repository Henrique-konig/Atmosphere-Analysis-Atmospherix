import { describe, expect, it } from "vitest";
import { addEntry, forecastKey, formatSavedAt, type CachedForecast } from "@/lib/forecastCache";
import type { ForecastResponse } from "@/lib/types";

const entry = (key: string, savedAt: number): CachedForecast => ({
  key,
  savedAt,
  data: {} as ForecastResponse,
});

describe("forecastKey", () => {
  it("rounds to about 100 m so the same place reuses its copy", () => {
    expect(forecastKey(-30.03461, -51.21771)).toBe("-30.035,-51.218");
  });
});

describe("addEntry", () => {
  it("puts the newest first and replaces the old copy of the same place", () => {
    const list = addEntry([entry("a", 1), entry("b", 2)], entry("b", 3));
    expect(list.map((e) => [e.key, e.savedAt])).toEqual([
      ["b", 3],
      ["a", 1],
    ]);
  });

  it("keeps at most `max` places", () => {
    const list = addEntry([entry("a", 1), entry("b", 2)], entry("c", 3), 2);
    expect(list.map((e) => e.key)).toEqual(["c", "a"]);
  });
});

describe("formatSavedAt", () => {
  const tz = "America/Sao_Paulo";
  const now = Date.UTC(2026, 9, 23, 20, 0); // 17:00 in São Paulo

  it("shows only the time for today", () => {
    expect(formatSavedAt(Date.UTC(2026, 9, 23, 17, 32), now, tz)).toBe("14:32");
  });

  it("says yesterday", () => {
    expect(formatSavedAt(Date.UTC(2026, 9, 22, 21, 5), now, tz)).toBe("ontem, 18:05");
  });

  it("adds the date when older", () => {
    expect(formatSavedAt(Date.UTC(2026, 9, 19, 12, 0), now, tz)).toBe("19/10, 09:00");
  });
});
