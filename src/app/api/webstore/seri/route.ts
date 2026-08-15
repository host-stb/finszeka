import { NextRequest, NextResponse } from "next/server";
import { ApiEnvelope } from "@/lib/types";
import { getMockWebstoreSeri } from "@/lib/webstore-mock";
import {
  fetchWebstoreAylikSeri,
  fetchWebstoreHaftalikSeri,
  fetchWebstoreYillikSeri,
} from "@/lib/webstore-report";
import { WebstoreGranularite, WebstoreSeri } from "@/lib/webstore-types";

export const dynamic = "force-dynamic";
// Aylık/Yıllık artık kutu (miktar) verisi için ham fatura satırlarını
// sayfalıyor (bkz. webstore-report.ts) — bu, Vercel'in varsayılan 10sn
// sınırını aşabilir; platformun izin verdiği en yükseğe çıkarıyoruz.
export const maxDuration = 60;

const GECERLI_GRANULARITELER: WebstoreGranularite[] = ["haftalik", "aylik", "yillik"];

/**
 * holistikmarket.com için haftalık/aylık/yıllık ciro trendi.
 * `?granularite=haftalik|aylik|yillik` (zorunlu), `?yil=2026` (sadece aylik
 * için, verilmezse bu yıl).
 *
 * GERÇEK Logo verisidir (bkz. src/lib/webstore-report.ts) — FASTAPI_BASE_URL
 * tanımlı değilse veya istek tamamen başarısız olursa mock veriye düşülür.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const granularite = params.get("granularite") as WebstoreGranularite | null;

  if (!granularite || !GECERLI_GRANULARITELER.includes(granularite)) {
    return NextResponse.json(
      { error: "Geçersiz granularite parametresi (haftalik|aylik|yillik olmalı)" },
      { status: 400 }
    );
  }

  const yilParam = params.get("yil");
  const yil = yilParam ? Number(yilParam) : undefined;

  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data =
        granularite === "aylik"
          ? await fetchWebstoreAylikSeri(base, yil)
          : granularite === "haftalik"
            ? await fetchWebstoreHaftalikSeri(base)
            : await fetchWebstoreYillikSeri(base);

      const envelope: ApiEnvelope<WebstoreSeri> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/webstore/seri] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const envelope: ApiEnvelope<WebstoreSeri> = {
    data: getMockWebstoreSeri(granularite, yil),
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
