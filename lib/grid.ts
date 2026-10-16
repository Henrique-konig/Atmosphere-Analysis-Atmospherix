import type { BBox, GridSpec } from "./types";

export const DEFAULT_BBOX: BBox = { north: -22, south: -34, west: -58, east: -47 };
export const DEFAULT_GRID_SIZE = 14;
export const MAX_GRID_SIZE = 20;

export function gridStep(grid: GridSpec) {
  const { bbox, nx, ny } = grid;
  return {
    dx: nx > 1 ? (bbox.east - bbox.west) / (nx - 1) : 0,
    dy: ny > 1 ? (bbox.north - bbox.south) / (ny - 1) : 0,
  };
}

/** Grid point coordinates, row-major starting at the north-west corner. */
export function gridPoints(grid: GridSpec): { lat: number; lon: number }[] {
  const { dx, dy } = gridStep(grid);
  const points: { lat: number; lon: number }[] = [];
  for (let row = 0; row < grid.ny; row++) {
    for (let col = 0; col < grid.nx; col++) {
      points.push({
        lat: round(grid.bbox.north - row * dy, 4),
        lon: round(grid.bbox.west + col * dx, 4),
      });
    }
  }
  return points;
}

/**
 * Converts meteorological wind (speed + direction the wind blows FROM, degrees)
 * into u/v components (direction the wind blows TO).
 */
export function windToUV(speed: number, directionDeg: number): { u: number; v: number } {
  const rad = (directionDeg * Math.PI) / 180;
  return { u: -speed * Math.sin(rad), v: -speed * Math.cos(rad) };
}

export function parseBBox(params: URLSearchParams): BBox | null {
  const values = ["north", "south", "west", "east"].map((k) => Number(params.get(k)));
  if (values.some((v) => !Number.isFinite(v))) return null;
  const [north, south, west, east] = values;
  if (north > 90 || south < -90 || north <= south) return null;
  if (west < -180 || east > 180 || east <= west) return null;
  return { north, south, west, east };
}

export function clampGridSize(value: string | null): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 2) return DEFAULT_GRID_SIZE;
  return Math.min(n, MAX_GRID_SIZE);
}

export function round(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** True when `outer` fully contains `inner`. */
export function bboxCovers(outer: BBox, inner: BBox): boolean {
  return (
    inner.north <= outer.north &&
    inner.south >= outer.south &&
    inner.west >= outer.west &&
    inner.east <= outer.east
  );
}

function bboxArea(b: BBox): number {
  return (b.north - b.south) * (b.east - b.west);
}

/**
 * Expands a map view outward to a coarse lattice (1°–10° depending on its size) so
 * nearby views request the exact same area and share the server/CDN cache.
 */
export function snapBBox(view: BBox): BBox {
  const span = Math.max(view.north - view.south, view.east - view.west);
  const step = span > 60 ? 10 : span > 20 ? 5 : span > 8 ? 2 : 1;
  return {
    north: Math.min(85, Math.ceil(view.north / step) * step),
    south: Math.max(-85, Math.floor(view.south / step) * step),
    west: Math.max(-180, Math.floor(view.west / step) * step),
    east: Math.min(180, Math.ceil(view.east / step) * step),
  };
}

/**
 * Whether the loaded area should be replaced for the current view: it does not cover
 * the view, or it is so much larger than the view that the grid looks too coarse.
 */
export function needsReload(loaded: BBox | null, view: BBox): boolean {
  if (!loaded) return true;
  return !bboxCovers(loaded, view) || bboxArea(loaded) > 12 * bboxArea(view);
}
