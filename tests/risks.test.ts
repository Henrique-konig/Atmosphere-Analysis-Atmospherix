import { describe, expect, it } from "vitest";
import { detectRisks, isSevereWeather, riskWhen } from "@/lib/risks";
import { calmForecast } from "./fixtures";

const at = (values: (number | null)[], index: number, value: number | null) => {
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

  it("never raises a risk from missing values", () => {
    const f = calmForecast({
      hourly: { visibility: at(calm.hourly.visibility, 2, null) },
      daily: { temperatureMin: at(calm.daily.temperatureMin, 0, null) },
    });
    expect(detectRisks(f)).toEqual([]);
  });

  it("ignores days beyond tomorrow", () => {
    const f = calmForecast({ daily: { temperatureMax: at(calm.daily.temperatureMax, 5, 40) } });
    expect(detectRisks(f)).toEqual([]);
  });

  it("escalates a thunderstorm with strong gusts to alerta", () => {
    const f = calmForecast({
      hourly: {
        weatherCode: at(calm.hourly.weatherCode, 4, 95),
        windGusts: at(calm.hourly.windGusts, 4, 70),
      },
    });
    const storm = detectRisks(f).find((r) => r.id === "storm");
    expect(storm).toMatchObject({ level: "alerta", title: "Tempestade com ventania" });
    expect(storm?.detail).toContain("70 km/h");
  });

  it("flags dangerous feels-like heat and cold even with mild air temperatures", () => {
    const hot = calmForecast({
      hourly: { apparentTemperature: at(calm.hourly.apparentTemperature, 6, 46) },
    });
    expect(detectRisks(hot)[0]).toMatchObject({
      id: "heat",
      level: "alerta",
      title: "Calor extremo",
      time: calm.hourly.time[6],
    });
    expect(detectRisks(hot)[0].detail).toMatch(/^Sensação térmica de até 46°/);

    const cold = calmForecast({
      hourly: { apparentTemperature: at(calm.hourly.apparentTemperature, 8, -2) },
    });
    expect(detectRisks(cold)[0]).toMatchObject({ id: "cold", level: "atenção" });
  });

  it("mentions both the maximum and a higher feels-like temperature", () => {
    const f = calmForecast({
      hourly: { apparentTemperature: at(calm.hourly.apparentTemperature, 6, 41) },
      daily: { temperatureMax: at(calm.daily.temperatureMax, 0, 36) },
    });
    expect(detectRisks(f)[0].detail).toMatch(/^Máxima de 36° e sensação térmica de até 41°\./);
  });

  it("separates severe weather from the other risks", () => {
    const f = calmForecast({
      hourly: {
        windGusts: at(calm.hourly.windGusts, 10, 65),
        visibility: at(calm.hourly.visibility, 2, 400),
      },
    });
    expect(detectRisks(f).map((r) => [r.id, isSevereWeather(r)])).toEqual([
      ["wind", true],
      ["fog", false],
    ]);
  });

  it("describes when a risk starts", () => {
    const now = calm.hourly.time[0];
    const tz = "America/Sao_Paulo";
    const risk = { id: "wind", level: "atenção" as const, title: "", detail: "" };
    expect(riskWhen({ ...risk, time: now }, now, tz)).toBe("agora");
    // "now" is 12:00 UTC, 09h in São Paulo.
    expect(riskWhen({ ...risk, time: now + 3 * 3600 }, now, tz)).toBe("a partir das 12h");
    expect(riskWhen({ ...risk, time: now + 86_400, allDay: true }, now, tz)).toBe("amanhã");
  });
});
