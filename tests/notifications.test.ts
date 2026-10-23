import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, pendingNotices, rainSoon, severeNotices } from "@/lib/notifications";
import { calmForecast } from "./fixtures";

const place = { key: "-30.00,-51.00", name: "Porto Alegre" };

const at = (values: (number | null)[], index: number, value: number | null) => {
  const copy = [...values];
  copy[index] = value;
  return copy;
};

/** Rain from hour `i` of the calm fixture. */
function rainAt(i: number, mm = 2, chance = 80) {
  const calm = calmForecast();
  return calmForecast({
    hourly: {
      precipitation: at(calm.hourly.precipitation, i, mm),
      precipitationProbability: at(calm.hourly.precipitationProbability, i, chance),
      weatherCode: at(calm.hourly.weatherCode, i, 63),
    },
  });
}

describe("rainSoon", () => {
  const start = calmForecast().hourly.time[0];

  it("says nothing on a dry forecast", () => {
    expect(rainSoon(calmForecast(), place, start + 600, 3)).toBeNull();
  });

  it("warns about rain starting within the lead time", () => {
    const f = rainAt(1);
    const notice = rainSoon(f, place, start + 10 * 60, 1);
    expect(notice).toMatchObject({
      tag: `rain:${place.key}:${f.hourly.time[1]}`,
      title: "Vai chover em ~1h · Porto Alegre",
    });
    expect(rainSoon(f, place, start + 30 * 60, 1)?.title).toBe(
      "Vai chover em ~30 min · Porto Alegre",
    );
    expect(notice?.body).toContain("Chuva por volta das 10h (80% de chance, 2,0 mm)");
  });

  it("ignores rain beyond the lead time", () => {
    expect(rainSoon(rainAt(3), place, start, 1)).toBeNull();
    expect(rainSoon(rainAt(3), place, start, 3)?.title).toBe("Vai chover em ~3h · Porto Alegre");
  });

  it("stays quiet when it is already raining", () => {
    const f = rainAt(2);
    expect(rainSoon(f, place, f.hourly.time[2] + 600, 1)).toBeNull();
    const wet = calmForecast({
      hourly: rainAt(2).hourly,
    });
    wet.current.weatherCode = 61;
    expect(rainSoon(wet, place, start, 3)).toBeNull();
  });

  it("ignores unlikely drizzle and missing values", () => {
    expect(rainSoon(rainAt(1, 0.1, 30), place, start, 2)).toBeNull();
    expect(rainSoon(rainAt(1, 2, 20), place, start, 2)).toBeNull();
    const missing = rainAt(1, 0, 80);
    missing.hourly.precipitation[1] = null;
    missing.hourly.weatherCode[1] = null;
    expect(rainSoon(missing, place, start, 2)).toBeNull();
  });
});

describe("severeNotices", () => {
  it("only reports alerta-level risks", () => {
    const calm = calmForecast();
    const gusty = calmForecast({ hourly: { windGusts: at(calm.hourly.windGusts, 4, 65) } });
    expect(severeNotices(gusty, place)).toEqual([]);
    const severe = calmForecast({ hourly: { windGusts: at(calm.hourly.windGusts, 4, 90) } });
    expect(severeNotices(severe, place)).toEqual([
      expect.objectContaining({ tag: expect.stringContaining(":wind:") }),
    ]);
  });
});

describe("pendingNotices", () => {
  const f = rainAt(1);
  const now = f.hourly.time[0] + 600;
  const settings = { ...DEFAULT_SETTINGS, rain: true };

  it("sends nothing while everything is off", () => {
    expect(pendingNotices(f, place, DEFAULT_SETTINGS, now, new Map())).toEqual([]);
  });

  it("never repeats a notice", () => {
    const [notice] = pendingNotices(f, place, settings, now, new Map());
    expect(notice).toBeDefined();
    expect(pendingNotices(f, place, settings, now, new Map([[notice.tag, now]]))).toEqual([]);
  });

  it("does not re-warn for the same place when the rain shifts by an hour", () => {
    const shifted = rainAt(2);
    const sent = new Map([[`rain:${place.key}:${f.hourly.time[1]}`, now]]);
    expect(pendingNotices(shifted, place, { ...settings, leadHours: 3 }, now + 1800, sent)).toEqual(
      [],
    );
    expect(
      pendingNotices(shifted, place, { ...settings, leadHours: 3 }, now + 4 * 3600, sent),
    ).toEqual([]);
  });
});
