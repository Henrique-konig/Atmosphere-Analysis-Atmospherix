import { NextResponse, type NextRequest } from "next/server";
import { fetchPointForecast, OpenMeteoError } from "@/lib/openmeteo";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  try {
    const forecast = await fetchPointForecast(lat, lon);
    return NextResponse.json(forecast, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}
