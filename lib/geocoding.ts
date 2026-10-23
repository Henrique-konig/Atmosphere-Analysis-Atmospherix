import "server-only";
import { OpenMeteoError } from "./openmeteo";
import type { Place } from "./types";

const BASE_URL =
  process.env.OPEN_METEO_GEOCODING_URL ?? "https://geocoding-api.open-meteo.com/v1/search";
/** Place names rarely change; cache aggressively. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  country_code?: string;
}

export async function searchPlaces(query: string, limit = 6, language = "pt"): Promise<Place[]> {
  const params = new URLSearchParams({
    name: query,
    count: String(limit),
    language,
    format: "json",
  });
  const res = await fetch(`${BASE_URL}?${params}`, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { reason?: string } | null;
    throw new OpenMeteoError(body?.reason ?? `Busca de locais respondeu ${res.status}`);
  }
  const json = (await res.json()) as { results?: GeocodingResult[] };
  return (json.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    region: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
