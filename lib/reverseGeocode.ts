/**
 * City name for a coordinate, from BigDataCloud's free client-side endpoint (no key).
 * Returns null when the lookup fails; callers fall back to "Minha localização".
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ name: string; detail?: string } | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "pt",
    });
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, {
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const name = json.city || json.locality;
    if (!name) return null;
    const detail = [json.principalSubdivision, json.countryName].filter(Boolean).join(", ");
    return { name, detail: detail || undefined };
  } catch {
    return null;
  }
}
