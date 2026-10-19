import { describe, expect, it } from "vitest";
import { detectRisks } from "@/lib/risks";
import { calmForecast } from "./fixtures";

const at = (values: number[], index: number, value: number) => {
  const copy = [...values];
  copy[index] = value;
  return copy;
};

describe("detectRisks", () => {
  const calm = calmForecast();

  it("finds nothing on a calm day", () => {
    expect(detectRisks(calm)).toEqual([]);
  });

  it("flags thunderstorms from the hour they start", () => {
    const f = calmForecast({ hourly: { weatherCode: at(calm.hourly.weatherCode, 5, 95) } });
    const [risk] = detectRisks(f);
    expect(risk).toMatchObject({ id: "storm", level: "atenção", time: calm.hourly.time[5] });
  });

  it("escalates hail and very heavy rain to alerta", () => {
    const f = calmForecast({
      hourly: {
        weatherCode: at(calm.hourly.weatherCode, 3, 99),
        precipitation: at(calm.hourly.precipitation, 3, 30),
      },
    });
    const risks = detectRisks(f);
    expect(risks.map((r) => [r.id, r.level])).toEqual([
      ["storm", "alerta"],
      ["rain", "alerta"],
    ]);
  });

  it("flags a rainy day even without an intense hour", () => {
    const f = calmForecast({ daily: { precipitationSum: at(calm.daily.precipitationSum, 1, 60) } });
    expect(detectRisks(f)[0]).toMatchObject({ id: "rain", level: "atenção" });
  });

  it("flags strong gusts, heat, cold, UV and fog", () => {
    const f = calmForecast({
      hourly: {
        windGusts: at(calm.hourly.windGusts, 10, 85),
        visibility: at(calm.hourly.visibility, 2, 400),
      },
      daily: {
        temperatureMax: at(calm.daily.temperatureMax, 0, 36),
        temperatureMin: at(calm.daily.temperatureMin, 1, -1),
        uvIndexMax: at(calm.daily.uvIndexMax, 0, 11),
      },
    });
    const byId = Object.fromEntries(detectRisks(f).map((r) => [r.id, r.level]));
    expect(byId).toEqual({
      wind: "alerta",
      heat: "atenção",
      cold: "alerta",
      uv: "alerta",
      fog: "atenção",
    });
  });

  it("lists the most dangerous risks first within a level", () => {
    const f = calmForecast({
      hourly: { weatherCode: at(calm.hourly.weatherCode, 20, 95) },
      daily: { uvIndexMax: at(calm.daily.uvIndexMax, 0, 9) },
    });
    expect(detectRisks(f).map((r) => [r.id, r.allDay ?? false])).toEqual([
      ["storm", false],
      ["uv", true],
    ]);
  });

  it("ignores days beyond tomorrow", () => {
    const f = calmForecast({ daily: { temperatureMax: at(calm.daily.temperatureMax, 5, 40) } });
    expect(detectRisks(f)).toEqual([]);
  });
});
