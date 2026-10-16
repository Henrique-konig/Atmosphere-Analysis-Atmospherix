export interface BBox {
  north: number;
  south: number;
  west: number;
  east: number;
}

/** Regular lat/lon grid, row-major from north-west to south-east. */
export interface GridSpec {
  bbox: BBox;
  nx: number;
  ny: number;
}

export interface GridForecast {
  grid: GridSpec;
  /** Unix timestamps (seconds, UTC) for each forecast step. */
  times: number[];
  /** Per time step, a flat array of nx * ny values. */
  temperature: number[][];
  precipitation: number[][];
  /** Wind components in m/s (u = eastward, v = northward). */
  windU: number[][];
  windV: number[][];
  generatedAt: string;
}

export interface PointForecast {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  times: number[];
  temperature: number[];
  apparentTemperature: number[];
  precipitation: number[];
  precipitationProbability: number[];
  windSpeed: number[];
  windGusts: number[];
  windDirection: number[];
  weatherCode: number[];
}

export type FieldLayer = "temperature" | "precipitation" | "none";

export interface Place {
  id: number;
  name: string;
  /** State / province, when known. */
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

/** A point the map should fly to; `id` changes on every request. */
export interface MapFocus {
  id: number;
  latitude: number;
  longitude: number;
  zoom: number;
}
