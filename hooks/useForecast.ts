"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { forecastKey, loadCachedForecast, storeCachedForecast } from "@/lib/forecastCache";
import type { ForecastResponse } from "@/lib/types";

/** Refresh in the background so an open tab stays current. */
const REFRESH_MS = 10 * 60 * 1000;
/** Set by the service worker on responses it served from its cache. */
const SAVED_AT_HEADER = "x-atmospherix-saved-at";
const OFFLINE = "Sem conexão com a internet.";

interface Result {
  key: string;
  data: ForecastResponse | null;
  error: string | null;
  /** When `data` was fetched, in milliseconds. */
  savedAt: number;
  /** True when `data` is an earlier copy, not the answer to the latest request. */
  fromCache: boolean;
}

const EMPTY: Result = { key: "", data: null, error: null, savedAt: 0, fromCache: false };

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function useForecast(coords: { lat: number; lon: number } | null) {
  const key = coords ? forecastKey(coords.lat, coords.lon) : "";
  const [result, setResult] = useState<Result>(EMPTY);
  const [tick, setTick] = useState(0);
  const online = useOnline();
  // The last forecast saved for this place, shown until (or instead of) a fresh one.
  const cached = useMemo(() => (key ? loadCachedForecast(key) : null), [key]);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const [lat, lon] = key.split(",");
    fetch(`/api/forecast?lat=${lat}&lon=${lon}`, { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha ao carregar a previsão");
        const data = json as ForecastResponse;
        const swSavedAt = Number(res.headers.get(SAVED_AT_HEADER));
        if (swSavedAt) {
          // Offline: the service worker answered with its last copy.
          setResult({ key, data, error: OFFLINE, savedAt: swSavedAt, fromCache: true });
          return;
        }
        const savedAt = Date.now();
        setResult({ key, data, error: null, savedAt, fromCache: false });
        storeCachedForecast({ key, savedAt, data });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          !navigator.onLine || err instanceof TypeError
            ? OFFLINE
            : err instanceof Error
              ? err.message
              : "Falha ao carregar a previsão";
        setResult((prev) =>
          prev.key === key && prev.data
            ? { ...prev, error: message, fromCache: true }
            : { ...EMPTY, key, error: message },
        );
      });
    return () => controller.abort();
  }, [key, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = window.setInterval(refresh, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    // Back online: replace the saved copy with fresh data.
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refresh);
    };
  }, [refresh]);

  const current = result.key === key;
  const live = current && result.data ? result : null;
  const data = live?.data ?? cached?.data ?? null;
  const fromCache = live ? live.fromCache : Boolean(cached);
  const error = current ? result.error : null;
  return {
    data,
    error,
    loading: Boolean(key) && (!current || (!result.data && !result.error)),
    /** When the shown data was fetched, in milliseconds. */
    savedAt: live?.savedAt ?? cached?.savedAt ?? null,
    /** The data on screen can't be refreshed: no network, or the server is failing. */
    stale: Boolean(data) && (!online || (fromCache && error !== null)),
    offline: !online || error === OFFLINE,
    refresh,
  };
}
