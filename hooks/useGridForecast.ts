"use client";

import { useCallback, useEffect, useState } from "react";
import type { BBox, GridForecast } from "@/lib/types";

interface Request {
  id: number;
  bbox: BBox;
}

interface Result {
  requestId: number;
  data: GridForecast | null;
  error: string | null;
}

/** Loads the forecast grid for an area; nothing is fetched until `load` is called. */
export function useGridForecast() {
  const [request, setRequest] = useState<Request | null>(null);
  const [result, setResult] = useState<Result>({ requestId: -1, data: null, error: null });

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    const query = new URLSearchParams(
      Object.entries(request.bbox).map(([k, v]) => [k, v.toFixed(3)]),
    );

    fetch(`/api/grid?${query}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar a previsão");
        setResult({ requestId: request.id, data: json as GridForecast, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Falha ao carregar a previsão";
        // Keep the previous forecast on screen if the new area fails.
        setResult((prev) => ({ requestId: request.id, data: prev.data, error: message }));
      });

    return () => controller.abort();
  }, [request]);

  const load = useCallback((bbox: BBox) => setRequest((r) => ({ id: (r?.id ?? 0) + 1, bbox })), []);

  return {
    data: result.data,
    error: result.error,
    loading: request !== null && result.requestId !== request.id,
    /** Area of the latest request, loaded or still in flight. */
    requestedBBox: request?.bbox ?? null,
    load,
  };
}
