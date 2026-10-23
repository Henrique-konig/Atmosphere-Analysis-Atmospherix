import { NextResponse, type NextRequest } from "next/server";
import { parseCoordinates } from "@/lib/grid";
import {
  fetchAirQuality,
  fetchForecast,
  fetchTemperatureAverages,
  OpenMeteoError,
} from "@/lib/openmeteo";
import type { ForecastResponse } from "@/lib/types";

export async function GET(req: NextRequest) {
  const coords = parseCoordinates(req.nextUrl.searchParams);
  if (!coords) return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

  // The averages and air quality are nice-to-haves: a failure there must not break the forecast.
  const [forecast, averages, airQuality] = await Promise.allSettled([
    fetchForecast(coords.lat, coords.lon),
    fetchTemperatureAverages(coords.lat, coords.lon),
    fetchAirQuality(coords.lat, coords.lon),
  ]);

  if (forecast.status === "rejected") {
    const err = forecast.reason;
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }

  const body: ForecastResponse = {
    forecast: forecast.value,
    averages: averages.status === "fulfilled" ? averages.value : null,
    airQuality: airQuality.status === "fulfilled" ? airQuality.value : null,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  });
}
