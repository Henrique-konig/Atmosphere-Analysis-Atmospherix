"use client";

import { useEffect, useState } from "react";
import type { PointForecast } from "@/lib/types";

interface Result {
  key: string;
  data: PointForecast | null;
  error: string | null;
}

export function usePointForecast(point: { lat: number; lon: number }) {
  const key = `${point.lat.toFixed(3)},${point.lon.toFixed(3)}`;
  const [result, setResult] = useState<Result>({ key: "", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const [lat, lon] = key.split(",");
    fetch(`/api/point?lat=${lat}&lon=${lon}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar o ponto");
        setResult({ key, data: json as PointForecast, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Falha ao carregar o ponto";
        setResult({ key, data: null, error: message });
      });
    return () => controller.abort();
  }, [key]);

  const current = result.key === key;
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: !current,
  };
}
