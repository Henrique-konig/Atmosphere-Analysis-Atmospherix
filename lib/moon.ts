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

const NAMES: [limit: number, name: string][] = [
  [0.0339, "Lua nova"],
  [0.216, "Lua crescente"],
  [0.284, "Quarto crescente"],
  [0.466, "Crescente gibosa"],
  [0.534, "Lua cheia"],
  [0.716, "Minguante gibosa"],
  [0.784, "Quarto minguante"],
  [0.9661, "Lua minguante"],
  [1, "Lua nova"],
];

export function moonInfo(unixSeconds: number): MoonInfo {
  const days = (unixSeconds - REFERENCE_NEW_MOON) / 86_400;
  const phase = (((days / SYNODIC_MONTH) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const name = NAMES.find(([limit]) => phase < limit)![1];
  const daysToFull = (((0.5 - phase + 1) % 1) * SYNODIC_MONTH) % SYNODIC_MONTH;
  const daysToNew = ((1 - phase) % 1) * SYNODIC_MONTH;
  return { phase, illumination, name, daysToFull, daysToNew };
}
