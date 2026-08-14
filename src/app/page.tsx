"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CompanyTabs from "@/components/CompanyTabs";
import FinanceOverview from "@/components/FinanceOverview";
import QuarterCompareCards from "@/components/QuarterCompareCards";
import ReportTable from "@/components/ReportTable";
import RevenueChart from "@/components/RevenueChart";
import SummaryCards from "@/components/SummaryCards";
import WebstoreOverview from "@/components/WebstoreOverview";
import { AlertIcon, RefreshIcon } from "@/components/icons";
import { formatTimestamp } from "@/lib/format";
import { QUARTERS } from "@/lib/report-utils";
import { ApiEnvelope, CompanyReport, CompanySummary } from "@/lib/types";

type View = "gelir" | "finans" | "webmagaza";

function baslangicGorunumu(): View {
  if (typeof window === "undefined") return "gelir";
  const v = new URLSearchParams(window.location.search).get("view");
  return v === "finans" || v === "webmagaza" ? v : "gelir";
}

export default function Home() {
  const [view, setView] = useState<View>(baslangicGorunumu);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    const res = await fetch("/api/companies", { cache: "no-store" });
    const envelope: ApiEnvelope<CompanySummary[]> = await res.json();
    setCompanies(envelope.data);
    if (envelope.data.length > 0) {
      setActiveId((current) => current ?? envelope.data[0].id);
    }
  }, []);

  const loadReport = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/report?company=${encodeURIComponent(companyId)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Rapor alınamadı (HTTP ${res.status})`);
      const envelope: ApiEnvelope<CompanyReport> = await res.json();
      setReport(envelope.data);
      setSource(envelope.source);
      setFetchedAt(envelope.fetchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ilk yüklemede firma listesini çekiyoruz
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    if (activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seçili firma değişince raporu çekiyoruz
      loadReport(activeId);
    }
  }, [activeId, loadReport]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6">
        {/* Üst başlık */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--brass)]">
              Gelir Defteri
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[var(--ink)]">
              {report ? report.companyName : "Yükleniyor..."}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {report ? `${report.period} dönemi gelir kırılımı` : "Rapor hazırlanıyor"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => activeId && loadReport(activeId)}
              disabled={loading || !activeId}
              className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </button>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              {source && (
                <span
                  className={`rounded-full px-2.5 py-1 font-medium ${
                    source === "live"
                      ? "bg-[var(--positive)]/10 text-[var(--positive)]"
                      : "bg-[var(--brass)]/10 text-[var(--brass-strong)]"
                  }`}
                  title={
                    source === "live"
                      ? "Veri FastAPI (satzeka/Logo) üzerinden canlı çekildi."
                      : "FASTAPI_BASE_URL tanımlı değil — örnek (mock) veri gösteriliyor."
                  }
                >
                  {source === "live" ? "● Canlı Veri" : "○ Örnek Veri"}
                </span>
              )}
              {fetchedAt && <span>Son güncelleme: {formatTimestamp(fetchedAt)}</span>}
            </div>
          </div>
        </header>

        {/* Görünüm menüsü */}
        <nav className="flex items-center gap-1">
          {(
            [
              { key: "gelir", label: "Gelir Raporu" },
              { key: "finans", label: "Finans Özeti" },
              { key: "webmagaza", label: "Web Mağaza" },
            ] as { key: View; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                view === item.key
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-[var(--paper-card)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {item.label}
              {item.key === "finans" && (
                <span className="ml-1.5 text-[10px] font-normal opacity-70">(Dummy)</span>
              )}
            </button>
          ))}
          <Link
            href="/kutu-trend"
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--paper-card)] hover:text-[var(--ink-soft)]"
          >
            Kutu Trendi
          </Link>
        </nav>

        {/* Firma sekmeleri — Web Mağaza sekmesi belirli bir markaya (holistikmarket.com) bağlı olduğu için firma seçiciden bağımsız */}
        {view !== "webmagaza" && (
          <div className="border-b border-[var(--line)]">
            <CompanyTabs companies={companies} activeId={activeId} onSelect={setActiveId} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-4 py-3 text-sm text-[var(--negative)]">
            <AlertIcon className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {view === "webmagaza" ? (
          <WebstoreOverview />
        ) : view === "finans" ? (
          <FinanceOverview companyName={report?.companyName ?? "Firma"} />
        ) : report ? (
          <>
            <SummaryCards report={report} />
            <QuarterCompareCards report={report} />
            <RevenueChart report={report} />

            <div className="flex flex-col gap-5">
              {QUARTERS.map((q) => (
                <div key={q.label}>
                  <div className="mb-2 flex items-baseline gap-2">
                    <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
                      {q.label}
                    </h2>
                    <span className="text-xs text-[var(--muted)]">
                      {q.months[0]} – {q.months[2]}
                    </span>
                  </div>
                  <div className="mb-3">
                    <SummaryCards
                      report={report}
                      months={q.months}
                      periodLabel={`${q.label} · ${report.period}`}
                      compact
                    />
                  </div>
                  <ReportTable
                    report={report}
                    months={q.months}
                    totalLabel={`Toplam ${q.label}`}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] py-24 text-sm text-[var(--muted)]">
            Rapor yükleniyor...
          </div>
        )}
      </div>
    </div>
  );
}
