"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCompactCurrency, formatPercent, formatTimestamp } from "@/lib/format";
import { ApiEnvelope } from "@/lib/types";
import { WebstoreRaporu } from "@/lib/webstore-types";
import WebstorePazaryeriKarsilastirma from "./WebstorePazaryeriKarsilastirma";
import { AlertIcon, RefreshIcon } from "./icons";

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-[11px] text-[var(--muted)]">veri yok</span>;
  }
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${
        positive ? "text-[var(--positive)]" : "text-[var(--negative)]"
      }`}
    >
      <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 ${positive ? "" : "rotate-180"}`} fill="currentColor" aria-hidden="true">
        <path d="M6 1.5l4.5 6h-9L6 1.5z" />
      </svg>
      {formatPercent(value)}
    </span>
  );
}

export default function WebstoreOverview() {
  const [raporu, setRaporu] = useState<WebstoreRaporu | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/webstore", { cache: "no-store" });
      if (!res.ok) throw new Error(`Web mağaza verisi alınamadı (HTTP ${res.status})`);
      const envelope: ApiEnvelope<WebstoreRaporu> = await res.json();
      setRaporu(envelope.data);
      setSource(envelope.source);
      setFetchedAt(envelope.fetchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ilk yüklemede web mağaza verisini çekiyoruz
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--ink)]">
            {raporu?.brandName ?? "holistikmarket.com"} · Web Mağaza
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Kendi site (Holistik.com + Ticimax) ve pazaryeri kanalları — Logo&apos;dan gerçek veri.
            Tutarlar KDV dahildir; kısa dönemlerde ayrıca KDV hariç matrah gösterilir.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={load}
            disabled={loading}
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
                    : "FASTAPI_BASE_URL tanımlı değil ya da istek başarısız oldu — örnek (mock) veri gösteriliyor."
                }
              >
                {source === "live" ? "● Canlı Veri" : "○ Örnek Veri"}
              </span>
            )}
            {fetchedAt && <span>Son güncelleme: {formatTimestamp(fetchedAt)}</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-4 py-3 text-sm text-[var(--negative)]">
          <AlertIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {raporu ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {raporu.donemler.map((d, i) => (
            <div
              key={d.key}
              className="animate-rise-in flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {d.label}
                </p>
                <DeltaBadge value={d.karsilastirma.degisimYuzde} />
              </div>
              <p className="mt-1.5 font-[family-name:var(--font-mono)] text-2xl font-semibold text-[var(--ink)] tabular-nums">
                {formatCompactCurrency(d.genelToplam)} ₺
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {d.genelFaturaAdedi.toLocaleString("tr-TR")} fatura · {d.karsilastirma.label}:{" "}
                {formatCompactCurrency(d.karsilastirma.genelToplam)} ₺
              </p>

              {d.matrahKirilimi.matrahHesaplandi ? (
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  Matrah (KDV hariç): {formatCompactCurrency(d.matrahKirilimi.matrah)} ₺ · KDV:{" "}
                  {formatCompactCurrency(d.matrahKirilimi.kdv)} ₺
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  KDV kırılımı bu dönem için hesaplanmadı (uzun dönem — sadece KDV dahil tutar).
                </p>
              )}

              <div className="mt-3 flex flex-col divide-y divide-[var(--line)] border-t border-[var(--line)]">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-[var(--ink-soft)]">{d.kendiSite.ad}</span>
                  <span className="flex items-center gap-2">
                    <DeltaBadge
                      value={
                        d.karsilastirma.kendiSiteToplam > 0
                          ? ((d.kendiSite.toplamTutar - d.karsilastirma.kendiSiteToplam) /
                              d.karsilastirma.kendiSiteToplam) *
                            100
                          : null
                      }
                    />
                    <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                      {formatCompactCurrency(d.kendiSite.toplamTutar)} ₺
                    </span>
                  </span>
                </div>
                {d.pazaryerleri.map((p) => {
                  const oncekiTutar = d.karsilastirma.pazaryerleriToplam[p.key] ?? 0;
                  return (
                    <div key={p.key} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-[var(--muted)]">{p.ad}</span>
                      <span className="flex items-center gap-2">
                        <DeltaBadge
                          value={
                            oncekiTutar > 0
                              ? ((p.toplamTutar - oncekiTutar) / oncekiTutar) * 100
                              : null
                          }
                        />
                        <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCompactCurrency(p.toplamTutar)} ₺
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--line-strong)] py-24 text-sm text-[var(--muted)]">
            Veri yükleniyor...
          </div>
        )
      )}

      {raporu && <WebstorePazaryeriKarsilastirma donemler={raporu.donemler} />}

      <Link
        href="/trend"
        className="animate-rise-in group flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] px-5 py-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors hover:border-[var(--brass)]"
      >
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
            Trend Grafikleri
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Günlük / Haftalık / Aylık / Yıllık grafikler ve yıl yıla karşılaştırma — ayrı sayfada.
          </p>
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-[var(--brass-strong)] transition-transform group-hover:translate-x-0.5">
          Görüntüle
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
