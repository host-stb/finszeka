"use client";

import { useState } from "react";
import { getMockFinanceMetrics } from "@/lib/finance-mock";
import { Granularity } from "@/lib/finance-types";
import { formatCompactCurrency } from "@/lib/format";
import { AlertIcon } from "./icons";

const GRANULARITY_OPTIONS: { key: Granularity; label: string }[] = [
  { key: "gunluk", label: "Günlük" },
  { key: "aylik", label: "Aylık" },
  { key: "yillik", label: "Yıllık" },
];

export default function FinanceOverview({ companyName }: { companyName: string }) {
  const [granularity, setGranularity] = useState<Granularity>("aylik");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const metrics = getMockFinanceMetrics(granularity);
  const selected = metrics.find((m) => m.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Bu bölümün tamamen örnek/dummy veri olduğunu açıkça belirten uyarı */}
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-[var(--brass)]/60 bg-[var(--brass-soft)]/30 px-4 py-3 text-xs text-[var(--brass-strong)]">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">DUMMY VERİ.</strong> Bu bölümdeki tüm rakamlar
          örnektir — Ödemeler, Tahsilatlar, Borçlar, Alacaklar, Banka, Harcamalar ve Hata
          (mutabakat farkı) için satzeka/FastAPI tarafında henüz gerçek bir uç nokta yok.
          Backend hazır olduğunda sadece <code>src/lib/finance-mock.ts</code> yerine gerçek
          bir API çağrısı bağlanacak, arayüz aynı kalacak.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--ink)]">
          {companyName} · Finans Özeti{" "}
          <span className="text-sm font-normal text-[var(--brass-strong)]">(Dummy)</span>
        </h2>
        <div className="flex gap-1 rounded-full border border-[var(--line-strong)] p-1">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGranularity(opt.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                granularity === opt.key
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {metrics.map((m, i) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelectedKey((cur) => (cur === m.key ? null : m.key))}
            className={`animate-rise-in rounded-2xl border p-3.5 text-left shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors ${
              selectedKey === m.key
                ? "border-[var(--brass)] bg-[var(--brass-soft)]/30"
                : "border-[var(--line)] bg-[var(--paper-card)] hover:bg-[var(--paper)]/70"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {m.label}
            </p>
            <p className="mt-1.5 font-[family-name:var(--font-mono)] text-base font-semibold text-[var(--ink)] tabular-nums sm:text-lg">
              {formatCompactCurrency(m.value)} ₺
            </p>
            {m.delta !== null && (
              <p
                className={`mt-1 text-[10px] font-medium ${
                  m.delta >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                }`}
              >
                {m.delta >= 0 ? "▲" : "▼"} %{Math.abs(m.delta).toFixed(1)}
              </p>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="animate-rise-in rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
              {selected.label} · Detay{" "}
              <span className="text-xs font-normal text-[var(--brass-strong)]">(Dummy)</span>
            </p>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink-soft)]"
            >
              Kapat
            </button>
          </div>
          <div className="mt-3 flex flex-col divide-y divide-[var(--line)]">
            {selected.detail.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-2 text-sm">
                <span className="text-[var(--ink-soft)]">{d.label}</span>
                <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                  {formatCompactCurrency(d.value)} ₺
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
