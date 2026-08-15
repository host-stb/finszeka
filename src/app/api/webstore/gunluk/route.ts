import { NextRequest, NextResponse } from "next/server";
import { ApiEnvelope } from "@/lib/types";
import { getMockWebstoreGunlukSeri } from "@/lib/webstore-mock";
import { fetchWebstoreGunlukSeri } from "@/lib/webstore-report";
import { WebstoreGunlukSeri } from "@/lib/webstore-types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Seçilen bir ay için holistikmarket.com günlük ciro serisi (+ varsa aynı
 * ayın geçen yılıyla karşılaştırma). `?yil=2026&ay=8` bekler.
 *
 * GERÇEK Logo verisidir (bkz. src/lib/webstore-report.ts) — FASTAPI_BASE_URL
 * tanımlı değilse veya istek tamamen başarısız olursa mock veriye düşülür.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const now = new Date();
  const yil = Number(params.get("yil") ?? now.getUTCFullYear());
  const ay = Number(params.get("ay") ?? now.getUTCMonth() + 1);

  if (!Number.isInteger(yil) || !Number.isInteger(ay) || ay < 1 || ay > 12) {
    return NextResponse.json({ error: "Geçersiz yil/ay parametresi" }, { status: 400 });
  }

  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data = await fetchWebstoreGunlukSeri(base, yil, ay);
      const envelope: ApiEnvelope<WebstoreGunlukSeri> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/webstore/gunluk] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const envelope: ApiEnvelope<WebstoreGunlukSeri> = {
    data: getMockWebstoreGunlukSeri(yil, ay),
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
