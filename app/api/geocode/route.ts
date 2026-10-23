import { NextResponse, type NextRequest } from "next/server";
import { searchPlaces } from "@/lib/geocoding";
import { isLocale } from "@/lib/i18n";
import { OpenMeteoError } from "@/lib/openmeteo";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "Digite entre 2 e 100 caracteres" }, { status: 400 });
  }

  try {
    const lang = req.nextUrl.searchParams.get("lang");
    const places = await searchPlaces(query, 6, lang && isLocale(lang) ? lang : "pt");
    return NextResponse.json(places, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err) {
    const status = err instanceof OpenMeteoError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status });
  }
}
