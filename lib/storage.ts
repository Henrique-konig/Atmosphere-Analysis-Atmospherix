import type { Place } from "./types";

/** A place the user picked, or their device location. */
export interface SavedPlace {
  name: string;
  detail?: string;
  latitude: number;
  longitude: number;
  /** True for "Minha localização" (device GPS). */
  current?: boolean;
}

const SAVED_KEY = "atmospherix:places";
const LAST_KEY = "atmospherix:last";
const HERE_KEY = "atmospherix:here";

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

export function samePlace(a: SavedPlace, b: SavedPlace): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;
}

export function fromSearch(place: Place, detail: string): SavedPlace {
  return { name: place.name, detail, latitude: place.latitude, longitude: place.longitude };
}
