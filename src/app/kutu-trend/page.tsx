"use client";

import Link from "next/link";
import KutuTrendSection from "@/components/KutuTrendSection";

export default function KutuTrendPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink-soft)]"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Ana sayfaya dön
            </Link>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--brass)]">
              Holimer + Fw İlaç · Konsolide
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[var(--ink)]">
              Kutu Trendi
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Günlük, haftalık, aylık ve yıllık toplam satılan kutu adedi ve kutu başına ciro
              (TL / EUR / USD) — Logo&apos;dan gerçek veri, TÜM şirketler ve satış kanalları dahil.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] px-4 py-3 text-xs leading-relaxed text-[var(--muted)]">
          <b className="text-[var(--ink-soft)]">Not:</b> &quot;Kutu adedi&quot;, fatura satırlarındaki
          miktar/birim toplamıdır. Bu sayfa TÜM şirketleri (Holimer + Fw İlaç) konsolide gösterir —
          şirketler arası satışlar varsa çift sayıma yol açabilir. Logo mirror veritabanında yalnızca
          belirli bir tarihten sonrası bulunuyorsa (bkz. Yıllık sekmesindeki not), önceki dönemlerle
          karşılaştırma o ölçüde sınırlıdır. EUR/USD dönüşümü TCMB&apos;nin günlük gösterge kurunu
          kullanır; kur o gün için yayınlanmamışsa (hafta sonu/tatil) son yayınlanan kur kullanılır.
        </div>

        <KutuTrendSection />
      </div>
    </div>
  );
}
