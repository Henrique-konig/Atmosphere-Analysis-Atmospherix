"use client";

import { useEffect, useState } from "react";
import type { SavedPlace } from "@/lib/storage";
import type { PlaceSummary } from "@/lib/types";

const MAX = 20;

export const placeKey = (p: SavedPlace) => `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`;

/** Current weather of each place in the city list, fetched while the list is open. */
export function usePlaceSummaries(places: SavedPlace[], enabled: boolean) {
  const [summaries, setSummaries] = useState<Record<string, PlaceSummary>>({});
  /** When the summaries arrived (unix seconds), for each city's local time. */
  const [now, setNow] = useState(0);
  const keys = places.slice(0, MAX).map(placeKey);
  const joined = keys.join(";");

  useEffect(() => {
    if (!enabled || !joined) return;
    const controller = new AbortController();
    const points = joined.split(";").map((k) => k.split(","));
    const lat = points.map((p) => p[0]).join(",");
    const lon = points.map((p) => p[1]).join(",");
    fetch(`/api/summary?lat=${lat}&lon=${lon}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<PlaceSummary[]>) : null))
      .then((list) => {
        if (!list) return;
        const keyed = Object.fromEntries(list.map((s, i) => [points[i].join(","), s]));
        setSummaries((prev) => ({ ...prev, ...keyed }));
        setNow(Date.now() / 1000);
      })
      // The list still works without temperatures.
      .catch(() => {});
    return () => controller.abort();
  }, [enabled, joined]);

  return { summaries, now };
}
