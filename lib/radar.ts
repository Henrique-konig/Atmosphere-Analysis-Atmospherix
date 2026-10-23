/**
 * Observed rain radar from RainViewer's free API. Since 2026 it only serves the past two hours
 * (no nowcast), the Universal Blue palette and zoom up to 7, so the map plays the radar first
 * and then continues with the model forecast for the next hours.
 */

export const RADAR_MAPS_URL = "https://api.rainviewer.com/public/weather-maps.json";

/** Highest zoom RainViewer serves for 512px tiles; the map scales them up beyond it. */
export const RADAR_MAX_ZOOM = 7;

/** The API has a frame every 10 minutes; every other one keeps the animation light. */
const RADAR_FRAME_EVERY = 2;

/** Universal Blue (scheme 2), smoothed, snow in its own colors. */
const RADAR_STYLE = "2/1_1";

export const RADAR_ATTRIBUTION = 'Radar: <a href="https://www.rainviewer.com/">RainViewer</a>';

/** Approximation of the Universal Blue palette, light to heavy, for the legend. */
export const RADAR_LEGEND_GRADIENT =
  "linear-gradient(to right, #88ddee, #0099cc, #0077aa, #005588, #ffee00, #ffaa00, #ff4400, #c10000, #ffaaff)";

export interface RadarFrame {
  /** Unix seconds, UTC. */
  time: number;
  /** Leaflet tile URL template for a 512px tile. */
  url: string;
}

export type TimelineFrame =
  | { kind: "radar"; time: number; radar: number }
  | { kind: "forecast"; time: number; forecast: number };

export interface Timeline {
  frames: TimelineFrame[];
  /** The frame closest to now: the latest radar image, or the first forecast hour. */
  now: number;
}

interface WeatherMaps {
  host?: unknown;
  radar?: { past?: unknown; nowcast?: unknown };
}

function isFrame(value: unknown): value is { time: number; path: string } {
  const v = value as { time?: unknown; path?: unknown } | null;
  return typeof v?.time === "number" && typeof v.path === "string";
}

/** Radar frames from weather-maps.json, oldest first; empty when the response is unusable. */
export function parseRadarMaps(json: unknown): RadarFrame[] {
  const maps = json as WeatherMaps | null;
  const host = maps?.host;
  const past = maps?.radar?.past;
  if (typeof host !== "string" || !/^https:\/\//.test(host) || !Array.isArray(past)) return [];
  const frames = past.filter(isFrame).sort((a, b) => a.time - b.time);
  // Count back from the latest frame so "now" is always included.
  const kept = frames.filter((_, i) => (frames.length - 1 - i) % RADAR_FRAME_EVERY === 0);
  return kept.map((f) => ({
    time: f.time,
    url: `${host}${f.path}/512/{z}/{x}/{y}/${RADAR_STYLE}.png`,
  }));
}

/** Radar frames followed by the forecast hours that come after the latest radar image. */
export function buildTimeline(radar: RadarFrame[], forecastTimes: number[]): Timeline {
  const frames: TimelineFrame[] = radar.map((f, i) => ({ kind: "radar", time: f.time, radar: i }));
  const last = radar.at(-1)?.time ?? -Infinity;
  forecastTimes.forEach((time, i) => {
    if (time > last) frames.push({ kind: "forecast", time, forecast: i });
  });
  return { frames, now: radar.length > 0 ? radar.length - 1 : 0 };
}
