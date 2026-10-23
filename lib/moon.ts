import { t, type MessageKey } from "./i18n";

/** Mean length of a lunar cycle (new moon to new moon), in days. */
export const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 1000;

export interface MoonInfo {
  /** 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
  phase: number;
  /** Illuminated fraction of the disc, 0–1. */
  illumination: number;
  name: string;
  /** Days until the next full / new moon. */
  daysToFull: number;
  daysToNew: number;
}

const NAMES: [limit: number, name: MessageKey][] = [
  [0.0339, "moon.new"],
  [0.216, "moon.waxingCrescent"],
  [0.284, "moon.firstQuarter"],
  [0.466, "moon.waxingGibbous"],
  [0.534, "moon.full"],
  [0.716, "moon.waningGibbous"],
  [0.784, "moon.lastQuarter"],
  [0.9661, "moon.waningCrescent"],
  [1, "moon.new"],
];

export function moonInfo(unixSeconds: number): MoonInfo {
  const days = (unixSeconds - REFERENCE_NEW_MOON) / 86_400;
  const phase = (((days / SYNODIC_MONTH) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const name = t(NAMES.find(([limit]) => phase < limit)![1]);
  const daysToFull = (((0.5 - phase + 1) % 1) * SYNODIC_MONTH) % SYNODIC_MONTH;
  const daysToNew = ((1 - phase) % 1) * SYNODIC_MONTH;
  return { phase, illumination, name, daysToFull, daysToNew };
}

/** "Hoje", "Amanhã" or "Em 5 dias", for a number of days ahead. */
export function daysUntil(days: number): string {
  const n = Math.round(days);
  return n === 0
    ? t("common.today")
    : n === 1
      ? t("common.tomorrow")
      : t("moon.inDays", { days: n });
}
