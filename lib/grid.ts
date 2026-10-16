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
