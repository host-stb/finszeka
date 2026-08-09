"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { exportFinanceToXlsx } from "@/lib/finance-export";
import { getMockFinanceMetrics, getMockUpcomingItems } from "@/lib/finance-mock";
import { Granularity } from "@/lib/finance-types";
import { formatCompactCurrency, formatTimestamp } from "@/lib/format";
import { AlertIcon, DownloadIcon } from "./icons";

const GRANULARITY_OPTIONS: { key: Granularity; label: string }[] = [
  { key: "gunluk", label: "Günlük" },
  { key: "aylik", label: "Aylık" },
  { key: "yillik", label: "Yıllık" },
];

function MiniTrendChart({ data }: { data: { month: string; value: number | null }[] }) {
  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="financeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brass)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brass)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => (v == null ? ["Henüz yok", ""] : [`${formatCompactCurrency(Number(v))} ₺`, ""])}
            labelFormatter={(l) => l}
            contentStyle={{
              background: "var(--ink)",
              border: "none",
              borderRadius: 10,
              fontSize: 11,
              color: "var(--paper)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--brass)"
            strokeWidth={2}
            fill="url(#financeFill)"
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function AgingBars({ buckets, total }: { buckets: { label: string; value: number }[]; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      {buckets.map((b) => {
        const pct = total > 0 ? (b.value / total) * 100 : 0;
        return (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--ink-soft)]">{b.label}</span>
              <span className="font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                {formatCompactCurrency(b.value)} ₺
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--brass)]"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FinanceOverview({ companyName }: { companyName: string }) {
  const [granularity, setGranularity] = useState<Granularity>("aylik");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const metrics = useMemo(() => getMockFinanceMetrics(granularity), [granularity]);
  const upcoming = useMemo(() => getMockUpcomingItems(), []);
  const selected = metrics.find((m) => m.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Bu bölümün tamamen örnek/dummy veri olduğunu açıkça belirten uyarı */}
      <div className="flex items-start gap-2 rounded-xl border border-dashed border-[var(--brass)]/60 bg-[var(--brass-soft)]/30 px-4 py-3 text-xs text-[var(--brass-strong)]">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong className="font-semibold">DUMMY VERİ.</strong> Bu bölümdeki rakamların çoğu
          örnektir — Ödemeler, Borçlar, Alacaklar, Banka, Harcamalar ve Hata (mutabakat farkı)
          için satzeka/FastAPI tarafında henüz gerçek bir uç nokta yok.{" "}
          <strong className="font-semibold text-[var(--positive)]">İstisna: Tahsilatlar</strong>{" "}
          aylık toplamları artık gerçek (VW_100_TAHSILATLAR, danışmanın 03.08.2026 SQL
          sorgusundan Oca-Ağu 2026) — kartta yeşil nokta bunu gösteriyor; fiş bazlı satır
          detayı ise hâlâ örnek. Backend hazır olduğunda sadece{" "}
          <code>src/lib/finance-mock.ts</code> yerine gerçek bir API çağrısı bağlanacak,
          arayüz aynı kalacak.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--ink)]">
          {companyName} · Finans Özeti{" "}
          <span className="text-sm font-normal text-[var(--brass-strong)]">(Dummy)</span>
        </h2>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={() => exportFinanceToXlsx(metrics, upcoming)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Excel&apos;e Aktar
          </button>
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-[var(--muted)]">
        Günlük/Aylık/Yıllık seçici sadece akış kalemlerinde (Ödemeler, Tahsilatlar, Harcamalar)
        etkilidir — Borçlar, Alacaklar, Banka ve Hata birer anlık durum olduğu için değişmez.
      </p>

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
            <div className="flex items-center justify-between gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {m.label}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {m.dataNote && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--positive)]"
                    title={m.dataNote}
                  />
                )}
                <span className="rounded-full bg-[var(--line)] px-1.5 py-0.5 text-[8px] font-medium uppercase text-[var(--muted)]">
                  {m.kind === "flow" ? "Akış" : "Anlık"}
                </span>
              </div>
            </div>
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
        <div className="animate-rise-in grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:grid-cols-2 sm:p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
                {selected.label} · Trend{" "}
                <span
                  className={`text-xs font-normal ${
                    selected.dataNote ? "text-[var(--positive)]" : "text-[var(--brass-strong)]"
                  }`}
                >
                  ({selected.dataNote ? "Kısmen Gerçek" : "Dummy"})
                </span>
              </p>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink-soft)]"
              >
                Kapat
              </button>
            </div>
            {selected.dataNote && (
              <p className="mt-1 text-[11px] text-[var(--positive)]">{selected.dataNote}</p>
            )}
            <div className="mt-2">
              <MiniTrendChart data={selected.trend} />
            </div>
          </div>

          <div>
            <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
              Kırılım
            </p>
            <div className="mt-2 flex flex-col divide-y divide-[var(--line)]">
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

          {selected.aging && (
            <div className="sm:col-span-2">
              <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
                Vade Analizi
              </p>
              <div className="mt-2">
                <AgingBars buckets={selected.aging} total={selected.value} />
              </div>
            </div>
          )}

          {selected.bankAccounts && (
            <div className="sm:col-span-2">
              <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
                Hesap Bazlı Bakiye
              </p>
              <div className="mt-2 overflow-hidden rounded-xl border border-[var(--line)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--paper)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="px-3 py-2 font-medium">Hesap</th>
                      <th className="px-3 py-2 font-medium">Son Hareket</th>
                      <th className="px-3 py-2 text-right font-medium">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.bankAccounts.map((acc) => (
                      <tr key={acc.name} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2 text-[var(--ink-soft)]">{acc.name}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">
                          {formatTimestamp(acc.lastTxnDate).split(" ").slice(0, 2).join(" ")}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCompactCurrency(acc.balance)} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selected.sampleRows && (
            <div className="sm:col-span-2">
              <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
                Son İşlemler{" "}
                <span className="text-xs font-normal text-[var(--brass-strong)]">
                  (örnek satır — fiş bazlı gerçek veri API&apos;ye bağlanınca burada listelenecek)
                </span>
              </p>
              <div className="mt-2 overflow-x-auto rounded-xl border border-[var(--line)]">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-[var(--paper)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="px-3 py-2 font-medium">Tarih</th>
                      <th className="px-3 py-2 font-medium">Cari</th>
                      <th className="px-3 py-2 font-medium">İşlem Yeri</th>
                      <th className="px-3 py-2 font-medium">Açıklama</th>
                      <th className="px-3 py-2 text-right font-medium">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.sampleRows.map((row) => (
                      <tr key={row.islemKod} className="border-t border-[var(--line)]">
                        <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                          {formatTimestamp(row.fisTarih).split(" ").slice(0, 2).join(" ")}
                        </td>
                        <td className="px-3 py-2 text-[var(--ink-soft)]">{row.cariAd}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">{row.islemYeri}</td>
                        <td className="px-3 py-2 text-[var(--muted)]">{row.aciklama}</td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCompactCurrency(row.tutar)} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Yaklaşan ödeme/tahsilatlar — dummy takvim */}
      <div className="animate-rise-in rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
        <p className="font-[family-name:var(--font-display)] text-base font-medium text-[var(--ink)]">
          Yaklaşan Ödemeler &amp; Tahsilatlar{" "}
          <span className="text-xs font-normal text-[var(--brass-strong)]">(Dummy)</span>
        </p>
        <div className="mt-3 flex flex-col divide-y divide-[var(--line)]">
          {upcoming.map((item) => (
            <div key={`${item.label}-${item.date}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    item.type === "odeme"
                      ? "bg-[var(--negative)]/10 text-[var(--negative)]"
                      : "bg-[var(--positive)]/10 text-[var(--positive)]"
                  }`}
                >
                  {item.type === "odeme" ? "Ödeme" : "Tahsilat"}
                </span>
                <span className="truncate text-sm text-[var(--ink-soft)]">{item.label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-sm">
                <span className="text-xs text-[var(--muted)]">
                  {formatTimestamp(item.date).split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="font-[family-name:var(--font-mono)] font-medium tabular-nums text-[var(--ink)]">
                  {formatCompactCurrency(item.value)} ₺
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
