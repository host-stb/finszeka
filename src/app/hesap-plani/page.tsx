"use client";

import Link from "next/link";
import HesapPlaniYonetimi from "@/components/HesapPlaniYonetimi";

export default function HesapPlaniPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6 px-4 py-8 sm:px-6">
        <header>
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
            Referans Tanımlar
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[var(--ink)]">
            Hesap Planı
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Hesap kodu, hesap adı ve neyi kapsadığına dair tanımları buradan girin — gelir tablosu
            ve diğer finansal kalemler hesaplanırken bu tanımlar referans alınır.
          </p>
        </header>

        <HesapPlaniYonetimi />
      </div>
    </div>
  );
}
