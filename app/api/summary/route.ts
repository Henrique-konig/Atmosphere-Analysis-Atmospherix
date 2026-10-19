import { NextResponse, type NextRequest } from "next/server";
import { parseCoordinateList } from "@/lib/grid";
import { fetchSummaries, MAX_SUMMARIES, OpenMeteoError } from "@/lib/openmeteo";

/** GET /api/summary?lat=a,b&lon=c,d → temperature and condition of each saved city. */
export async function GET(req: NextRequest) {
  const points = parseCoordinateList(req.nextUrl.searchParams, MAX_SUMMARIES);
  if (!points) return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });

  try {
    const summaries = await fetchSummaries(points);
    return NextResponse.json(summaries, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (err) {
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}
