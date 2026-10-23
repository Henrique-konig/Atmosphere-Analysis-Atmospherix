"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Place } from "@/lib/types";

const DEBOUNCE_MS = 300;

interface Result {
  query: string;
  places: Place[];
  error: string | null;
}

/** Debounced place search in `lang`; results always belong to the current query. */
export function usePlaceSearch(rawQuery: string, lang: string) {
  const query = rawQuery.trim();
  const key = `${lang}:${query}`;
  const [result, setResult] = useState<Result>({ query: "", places: [], error: null });

  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(query)}&lang=${lang}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? t("error.search"));
          setResult({ query: key, places: json as Place[], error: null });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const message = err instanceof Error ? err.message : t("error.search");
          setResult({ query: key, places: [], error: message });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang, key]);

  const active = query.length >= 2;
  const current = active && result.query === key;
  return {
    places: current ? result.places : [],
    error: current ? result.error : null,
    loading: active && !current,
  };
}
