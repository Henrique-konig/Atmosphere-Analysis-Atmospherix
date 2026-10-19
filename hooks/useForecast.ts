"use client";

import { useCallback, useEffect, useState } from "react";
import type { ForecastResponse } from "@/lib/types";

/** Refresh in the background so an open tab stays current. */
const REFRESH_MS = 10 * 60 * 1000;

interface Result {
  key: string;
  data: ForecastResponse | null;
  error: string | null;
}

export function useForecast(coords: { lat: number; lon: number } | null) {
  const key = coords ? `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}` : "";
  const [result, setResult] = useState<Result>({ key: "", data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const [lat, lon] = key.split(",");
    fetch(`/api/forecast?lat=${lat}&lon=${lon}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar a previsão");
        setResult({ key, data: json as ForecastResponse, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Falha ao carregar a previsão";
        setResult((prev) => ({ key, data: prev.key === key ? prev.data : null, error: message }));
      });
    return () => controller.abort();
  }, [key, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const current = result.key === key;
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: Boolean(key) && (!current || (!result.data && !result.error)),
    refresh,
  };
}
