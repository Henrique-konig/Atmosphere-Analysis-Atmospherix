import { afterEach, describe, expect, it } from "vitest";
import { describeWeather } from "@/lib/conditions";
import { compassPoint, formatHour, formatRain, formatWeekday } from "@/lib/format";
import { detectLocale, setLocale, t } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { es } from "@/lib/i18n/es";
import { pt } from "@/lib/i18n/pt";
import { moonInfo } from "@/lib/moon";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

afterEach(() => setLocale("pt"));

describe("translations", () => {
  it("every language uses the same placeholders as Portuguese", () => {
    for (const messages of [en, es]) {
      for (const [key, text] of Object.entries(pt)) {
        const other = messages[key as keyof typeof pt];
        expect(other, key).toBeTruthy();
        expect(placeholders(other), key).toEqual(placeholders(text));
      }
    }
  });

  it("fills in placeholders in the current language", () => {
    expect(t("cities.remove", { name: "Lisboa" })).toBe("Remover Lisboa");
    setLocale("en");
    expect(t("cities.remove", { name: "Lisboa" })).toBe("Remove Lisboa");
    setLocale("es");
    expect(t("daily.title", { days: 10 })).toBe("Pronóstico de 10 días");
  });

  it("picks the browser language, falling back to Portuguese", () => {
    expect(detectLocale(["en-GB", "pt-BR"])).toBe("en");
    expect(detectLocale(["es-AR"])).toBe("es");
    expect(detectLocale(["fr-FR", "de"])).toBe("pt");
    expect(detectLocale([])).toBe("pt");
  });

  it("translates conditions, the moon and compass points", () => {
    setLocale("en");
    expect(describeWeather(63).label).toBe("Rain");
    expect(moonInfo(Date.UTC(2000, 0, 6, 18, 14) / 1000).name).toBe("New moon");
    expect(compassPoint(90)).toBe("E");
    setLocale("es");
    expect(describeWeather(0, false).label).toBe("Despejado");
    expect(compassPoint(225)).toBe("SO");
  });

  it("formats times and decimals for each language", () => {
    const t0 = Date.UTC(2025, 9, 20, 15, 5) / 1000; // Monday 12:05 in São Paulo
    setLocale("en");
    expect(formatHour(t0, "America/Sao_Paulo")).toBe("12 PM");
    expect(formatWeekday(t0, "America/Sao_Paulo")).toBe("Mon");
    expect(formatRain(0.4)).toBe("0.4");
    setLocale("es");
    expect(formatHour(t0, "America/Sao_Paulo")).toBe("12 h");
    expect(formatWeekday(t0, "America/Sao_Paulo")).toBe("Lun");
    expect(formatRain(0.4)).toBe("0,4");
  });
});
