import { NextRequest, NextResponse } from "next/server";
import { ApiEnvelope } from "@/lib/types";
import { getMockKutuSeri } from "@/lib/kutu-mock";
import {
  fetchKutuAylikSeri,
  fetchKutuGunlukSeri,
  fetchKutuHaftalikSeri,
  fetchKutuYillikSeri,
} from "@/lib/kutu-report";
import { KutuGranularite, KutuSeri } from "@/lib/kutu-types";

export const dynamic = "force-dynamic";

const GECERLI_GRANULARITELER: KutuGranularite[] = ["gunluk", "haftalik", "aylik", "yillik"];

/**
 * TÜM şirketler (Holimer + Fw İlaç, konsolide) için günlük/haftalık/aylık/yıllık
 * kutu adedi trendi + kutu başına ciro (TL/EUR/USD).
 * `?granularite=gunluk|haftalik|aylik|yillik` (zorunlu), `?yil=2026` (aylik/gunluk
 * için, verilmezse bu yıl), `?ay=8` (sadece gunluk için, verilmezse bu ay).
 *
 * GERÇEK Logo verisidir (bkz. src/lib/kutu-report.ts) — FASTAPI_BASE_URL
 * tanımlı değilse veya istek tamamen başarısız olursa mock veriye düşülür.
 * EUR/USD dönüşümü TCMB'nin resmi günlük gösterge kurunu kullanır (bkz.
 * src/lib/kur-api.ts) — TCMB'ye ulaşılamazsa TL rakamları yine gösterilir,
 * EUR/USD kolonları "kur alınamadı" ile işaretlenir (rakam uydurulmaz).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const granularite = params.get("granularite") as KutuGranularite | null;

  if (!granularite || !GECERLI_GRANULARITELER.includes(granularite)) {
    return NextResponse.json(
      { error: "Geçersiz granularite parametresi (gunluk|haftalik|aylik|yillik olmalı)" },
      { status: 400 }
    );
  }

  const yilParam = params.get("yil");
  const ayParam = params.get("ay");
  const yil = yilParam ? Number(yilParam) : undefined;
  const ay = ayParam ? Number(ayParam) : undefined;

  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data =
        granularite === "gunluk"
          ? await fetchKutuGunlukSeri(base, yil, ay)
          : granularite === "haftalik"
            ? await fetchKutuHaftalikSeri(base)
            : granularite === "aylik"
              ? await fetchKutuAylikSeri(base, yil)
              : await fetchKutuYillikSeri(base);

      const envelope: ApiEnvelope<KutuSeri> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/kutu-trend/seri] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const envelope: ApiEnvelope<KutuSeri> = {
    data: getMockKutuSeri(granularite, yil, ay),
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
