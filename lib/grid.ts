import type { BBox, GridSpec } from "./types";

/** Rain map: a square of this many degrees around the location... */
export const RAIN_MAP_SPAN = 5;
/** ...sampled on an n × n grid (~30 km spacing). */
export const RAIN_MAP_GRID = 16;

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
 * A box of `span` degrees centred near a point. The centre is snapped to a quarter
 * degree so nearby locations request the same area and share the cache.
 */
export function bboxAround(lat: number, lon: number, span = RAIN_MAP_SPAN): BBox {
  const snap = (v: number) => Math.round(v * 4) / 4;
  const half = span / 2;
  const cLat = snap(lat);
  const cLon = snap(lon);
  return {
    north: Math.min(85, cLat + half),
    south: Math.max(-85, cLat - half),
    west: Math.max(-180, cLon - half),
    east: Math.min(180, cLon + half),
  };
}

export function parseCoordinates(params: URLSearchParams): { lat: number; lon: number } | null {
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (!params.get("lat") || !params.get("lon")) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** "lat=-30,-23&lon=-51,-46" → two points; null when any is invalid or the lists differ. */
export function parseCoordinateList(
  params: URLSearchParams,
  max: number,
): { lat: number; lon: number }[] | null {
  const lats = (params.get("lat") ?? "").split(",");
  const lons = (params.get("lon") ?? "").split(",");
  if (lats.length !== lons.length || lats.length > max) return null;
  const points = lats.map((lat, i) => parseCoordinates(new URLSearchParams({ lat, lon: lons[i] })));
  return points.every((p) => p !== null) ? (points as { lat: number; lon: number }[]) : null;
}

export function round(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
