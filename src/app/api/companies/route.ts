import { NextResponse } from "next/server";
import { fetchCompaniesFromLogo } from "@/lib/logo-report";
import { MOCK_COMPANIES } from "@/lib/mock-data";
import { ApiEnvelope, CompanySummary } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Firma listesini döndürür.
 *
 * FASTAPI_BASE_URL tanımlıysa gerçek Logo entegrasyonuna (satzeka'nın
 * beslediği FastAPI) bağlanır: GET {FASTAPI_BASE_URL}/logo/durum -> sirketler[]
 * Tanımlı değilse veya istek başarısız olursa mock veri döner.
 */
export async function GET() {
  const base = process.env.FASTAPI_BASE_URL?.replace(/\/$/, "");

  if (base) {
    try {
      const data = await fetchCompaniesFromLogo(base);
      const envelope: ApiEnvelope<CompanySummary[]> = {
        data,
        source: "live",
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(envelope);
    } catch (err) {
      console.error("[api/companies] FastAPI'ye erişilemedi, mock veriye düşülüyor:", err);
    }
  }

  const envelope: ApiEnvelope<CompanySummary[]> = {
    data: MOCK_COMPANIES,
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(envelope);
}
