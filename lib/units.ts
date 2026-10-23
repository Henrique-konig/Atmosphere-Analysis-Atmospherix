/**
 * Display units. Forecasts always arrive in metric (°C, km/h, mm); values are converted only
 * when shown, so thresholds and colour scales keep working in metric.
 */
export type TemperatureUnit = "c" | "f";
export type SpeedUnit = "kmh" | "mph";
export type PrecipitationUnit = "mm" | "in";

export interface Units {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
  precipitation: PrecipitationUnit;
}

export const METRIC: Units = { temperature: "c", speed: "kmh", precipitation: "mm" };

const KM_PER_MILE = 1.609344;
const MM_PER_INCH = 25.4;

/**
 * The units in use. Module state rather than context so that every formatter (and the text
 * built in lib/) follows it without threading a parameter through; the screen re-renders
 * when it changes.
 */
let current: Units = METRIC;

export const getUnits = () => current;

export function setUnits(units: Units) {
  current = units;
}

export function isUnits(value: unknown): value is Units {
  if (typeof value !== "object" || value === null) return false;
  const u = value as Record<string, unknown>;
  return (
    (u.temperature === "c" || u.temperature === "f") &&
    (u.speed === "kmh" || u.speed === "mph") &&
    (u.precipitation === "mm" || u.precipitation === "in")
  );
}

/** °C → the chosen unit. */
export const convertTemp = (celsius: number) =>
  current.temperature === "f" ? (celsius * 9) / 5 + 32 : celsius;

/** A temperature difference (°C) → the chosen unit. */
export const convertTempDelta = (celsius: number) =>
  current.temperature === "f" ? (celsius * 9) / 5 : celsius;

/** km/h → the chosen unit. */
export const convertSpeed = (kmh: number) => (current.speed === "mph" ? kmh / KM_PER_MILE : kmh);

export const speedUnit = () => (current.speed === "mph" ? "mph" : "km/h");

/** Visibility follows the speed unit: km with km/h, miles with mph. */
export const convertDistance = (km: number) => (current.speed === "mph" ? km / KM_PER_MILE : km);

export const distanceUnit = () => (current.speed === "mph" ? "mi" : "km");

/** mm → the chosen unit. */
export const convertPrecipitation = (mm: number) =>
  current.precipitation === "in" ? mm / MM_PER_INCH : mm;

export const precipitationUnit = () => (current.precipitation === "in" ? "in" : "mm");
