import { NextResponse } from "next/server";
import { ApiEnvelope } from "@/lib/types";
import { getMockWebstoreRaporu } from "@/lib/webstore-mock";
import { fetchWebstoreRaporu } from "@/lib/webstore-report";
import { WebstoreRaporu } from "@/lib/webstore-types";

export const dynamic = "force-dynamic";

/**
 * holistikmarket.com için Bugün/Bu Hafta/Bu Ay/Yılbaşından Bugüne ciro
 * özeti (kendi site + pazaryeri kanalları kalem kalem).
 *
 * GERÇEK Logo verisidir (bkz. src/lib/webstore-report.ts) — FASTAPI_BASE_URL
 * tanımlı değilse veya istek tamamen başarısız olursa mock veriye düşülür.
 */
export async function GET() {
  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data = await fetchWebstoreRaporu(base);
      const envelope: ApiEnvelope<WebstoreRaporu> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/webstore] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const envelope: ApiEnvelope<WebstoreRaporu> = {
    data: getMockWebstoreRaporu(),
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
