import { afterEach, describe, expect, it } from "vitest";
import {
  formatDistanceNumber,
  formatRain,
  formatRainAmount,
  formatSpeed,
  formatTemp,
  formatTempNumber,
} from "@/lib/format";
import { isUnits, METRIC, setUnits } from "@/lib/units";

const IMPERIAL = { temperature: "f", speed: "mph", precipitation: "in" } as const;

afterEach(() => setUnits(METRIC));

describe("units", () => {
  it("formats in metric by default", () => {
    expect(formatTemp(21.4)).toBe("21°");
    expect(formatSpeed(20)).toBe("20 km/h");
    expect(formatRainAmount(2.5)).toBe("2,5 mm");
    expect(formatDistanceNumber(24)).toBe("24");
  });

  it("converts to imperial units", () => {
    setUnits(IMPERIAL);
    expect(formatTemp(0)).toBe("32°");
    expect(formatTemp(-40)).toBe("-40°");
    expect(formatTempNumber(37)).toBe("99");
    expect(formatSpeed(100)).toBe("62 mph");
    expect(formatRainAmount(25.4)).toBe("1,0 in");
    expect(formatRain(5)).toBe("0,20");
    expect(formatRain(0.1)).toBe("0");
    expect(formatDistanceNumber(10)).toBe("6.2");
  });

  it("mixes units independently", () => {
    setUnits({ ...METRIC, temperature: "f" });
    expect(formatTemp(30)).toBe("86°");
    expect(formatSpeed(10)).toBe("10 km/h");
  });

  it("rejects malformed saved units", () => {
    expect(isUnits(IMPERIAL)).toBe(true);
    expect(isUnits({ temperature: "k", speed: "mph", precipitation: "in" })).toBe(false);
    expect(isUnits(null)).toBe(false);
    expect(isUnits("metric")).toBe(false);
  });
});
