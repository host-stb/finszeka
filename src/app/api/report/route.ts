import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyReportFromLogo } from "@/lib/logo-report";
import { getMockReport } from "@/lib/mock-data";
import { ApiEnvelope, CompanyReport } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Bir firmanın gelir raporunu döndürür.
 *
 * Query: ?company=<sirket adı, ör. "Holimer">
 *
 * FASTAPI_BASE_URL tanımlıysa gerçek Logo entegrasyonundan (satzeka'nın
 * beslediği FastAPI) /logo/satislar/ozet uç noktası ay ay çekilip
 * CompanyReport'a dönüştürülür (bkz. src/lib/logo-report.ts). Toplam
 * (GİRDİLER TOPLAM) satırı %100 gerçektir; kategori kırılımı en çok satış
 * yapılan carilerden türetilen en iyi çaba (best-effort) bir tahmindir —
 * detay için README.md'deki "Gerçek veri kaynağı" bölümüne bakın.
 *
 * Tanımlı değilse veya istek başarısız olursa mock veri döner.
 */
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("company");

  if (!companyId) {
    return NextResponse.json({ error: "company parametresi zorunludur" }, { status: 400 });
  }

  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data = await fetchCompanyReportFromLogo(base, companyId);
      const envelope: ApiEnvelope<CompanyReport> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/report] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const mock = getMockReport(companyId);
  if (!mock) {
    return NextResponse.json({ error: `Bilinmeyen firma: ${companyId}` }, { status: 404 });
  }

  const envelope: ApiEnvelope<CompanyReport> = {
    data: mock,
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
