"use client";

import { useEffect, useState } from "react";
import { parseRadarMaps, RADAR_MAPS_URL, type RadarFrame } from "@/lib/radar";

/** New radar images arrive every 10 minutes. */
const REFRESH_MS = 10 * 60 * 1000;

/** Recent radar frames, oldest first; null while loading, empty if the radar is unavailable. */
export function useRadarFrames(): RadarFrame[] | null {
  const [frames, setFrames] = useState<RadarFrame[] | null>(null);

  useEffect(() => {
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      fetch(RADAR_MAPS_URL, { signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const next = parseRadarMaps(json);
          // Keep the frames already shown if a refresh fails.
          setFrames((prev) => (next.length === 0 && prev?.length ? prev : next));
        })
        .catch(() => {
          if (!signal.aborted) setFrames((prev) => prev ?? []);
        });
    };
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      controller.abort();
    };
  }, []);

  return frames;
}
