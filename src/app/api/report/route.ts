import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyReportFromLogo } from "@/lib/logo-report";
import { getMockReport } from "@/lib/mock-data";
import { ApiEnvelope, CompanyReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Company reports use the complete invoice mirror. Live errors never substitute sample figures. */
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
      console.error("[api/report] Canlı şirket raporu alınamadı:", err);
      return NextResponse.json({error:"Canlı şirket raporu alınamadı. Lütfen yeniden deneyin."},{status:502});
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
