"use client";

import { useEffect, useState } from "react";
import type { PrecipitationGrid } from "@/lib/types";

export function useRainGrid(coords: { lat: number; lon: number }) {
  const key = `${coords.lat.toFixed(2)},${coords.lon.toFixed(2)}`;
  const [result, setResult] = useState<{ key: string; data: PrecipitationGrid | null }>({
    key: "",
    data: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const [lat, lon] = key.split(",");
    fetch(`/api/rain?lat=${lat}&lon=${lon}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setResult({ key, data: json as PrecipitationGrid | null }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, data: null });
      });
    return () => controller.abort();
  }, [key]);

  return result.key === key ? result.data : null;
}
