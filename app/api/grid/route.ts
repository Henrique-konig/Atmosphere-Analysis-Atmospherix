import { NextResponse, type NextRequest } from "next/server";
import { clampGridSize, DEFAULT_BBOX, parseBBox } from "@/lib/grid";
import { fetchGridForecast, OpenMeteoError } from "@/lib/openmeteo";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const hasBBox = params.has("north");
  const bbox = hasBBox ? parseBBox(params) : DEFAULT_BBOX;
  if (!bbox) {
    return NextResponse.json({ error: "Parâmetros de área inválidos" }, { status: 400 });
  }
  const size = clampGridSize(params.get("size"));

  try {
    const forecast = await fetchGridForecast({ bbox, nx: size, ny: size });
    return NextResponse.json(forecast, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}
