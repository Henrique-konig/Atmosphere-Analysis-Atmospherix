import { NextResponse, type NextRequest } from "next/server";
import { bboxAround, parseCoordinates, RAIN_MAP_GRID } from "@/lib/grid";
import { fetchPrecipitationGrid, OpenMeteoError } from "@/lib/openmeteo";

export async function GET(req: NextRequest) {
  const coords = parseCoordinates(req.nextUrl.searchParams);
  if (!coords) return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

  try {
    const grid = { bbox: bboxAround(coords.lat, coords.lon), nx: RAIN_MAP_GRID, ny: RAIN_MAP_GRID };
    const rain = await fetchPrecipitationGrid(grid);
    return NextResponse.json(rain, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}
