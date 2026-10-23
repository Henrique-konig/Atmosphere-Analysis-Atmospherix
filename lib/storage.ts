import type { ThemePreference } from "./theme";
import type { Place } from "./types";
import { isUnits, METRIC, type Units } from "./units";

/** A place the user picked, or their device location. */
export interface SavedPlace {
  name: string;
  detail?: string;
  latitude: number;
  longitude: number;
  /** True for "Minha localização" (device GPS). */
  current?: boolean;
}

// Favorite cities, in the order the user saved them.
const SAVED_KEY = "atmospherix:places";
const LAST_KEY = "atmospherix:last";
const HERE_KEY = "atmospherix:here";
const UNITS_KEY = "atmospherix:units";
const THEME_KEY = "atmospherix:theme";

// Storage can be unavailable (private mode, blocked cookies): never let it throw.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const loadSavedPlaces = () => read<SavedPlace[]>(SAVED_KEY, []);
export const storeSavedPlaces = (places: SavedPlace[]) => write(SAVED_KEY, places);
export const loadLastPlace = () => read<SavedPlace | null>(LAST_KEY, null);
export const storeLastPlace = (place: SavedPlace) => write(LAST_KEY, place);
/** The last device location, shown as "Minha localização" at the top of the city list. */
export const loadHere = () => read<SavedPlace | null>(HERE_KEY, null);
export const storeHere = (place: SavedPlace) => write(HERE_KEY, place);

export function loadUnits(): Units {
  const units = read<unknown>(UNITS_KEY, null);
  return isUnits(units) ? units : METRIC;
}
export const storeUnits = (units: Units) => write(UNITS_KEY, units);

export function loadTheme(): ThemePreference {
  const theme = read<unknown>(THEME_KEY, null);
  return theme === "light" || theme === "dark" ? theme : "auto";
}
export const storeTheme = (theme: ThemePreference) => write(THEME_KEY, theme);

export function samePlace(a: SavedPlace, b: SavedPlace): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}

/** Adds the place to the favorites, or removes it when it is already there. */
export function toggleFavorite(list: SavedPlace[], place: SavedPlace): SavedPlace[] {
  if (list.some((p) => samePlace(p, place))) return list.filter((p) => !samePlace(p, place));
  return [
    ...list,
    {
      name: place.name,
      detail: place.detail,
      latitude: place.latitude,
      longitude: place.longitude,
    },
  ];
}

export function fromSearch(place: Place, detail: string): SavedPlace {
  return { name: place.name, detail, latitude: place.latitude, longitude: place.longitude };
}
