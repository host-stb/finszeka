"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency, formatDate, formatInteger } from "@/lib/format";
import { ApiEnvelope } from "@/lib/types";
import { WebstoreGranularite, WebstoreSeri } from "@/lib/webstore-types";
import { RefreshIcon } from "./icons";

interface TooltipPayload {
  value: number;
  payload: { label: string; baslangic: string; bitis: string; veriAlinamadi?: boolean };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{point.payload.label}</p>
      {point.payload.veriAlinamadi ? (
        <p className="mt-0.5 text-sm font-medium text-[var(--negative)]">Veri alınamadı</p>
      ) : (
        <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums text-[var(--brass-soft)]">
          {formatCompactCurrency(point.value)} ₺
        </p>
      )}
    </div>
  );
}

const BASLIKLAR: Record<WebstoreGranularite, { baslik: string; aciklama: string }> = {
  haftalik: { baslik: "Haftalık", aciklama: "Son 12 hafta (Pazartesi–Pazar), KDV dahil." },
  aylik: { baslik: "Aylık", aciklama: "Seçilen yılın ay ay cirosu, KDV dahil." },
  yillik: { baslik: "Yıllık", aciklama: "Logo'daki en eski faturadan bugüne yıllık ciro, KDV dahil." },
};

export default function WebstoreSeriChart({ granularite }: { granularite: WebstoreGranularite }) {
  const buYil = new Date().getUTCFullYear();
  const [yil, setYil] = useState(buYil);
  const [seri, setSeri] = useState<WebstoreSeri | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ granularite });
      if (granularite === "aylik") qs.set("yil", String(yil));
      const res = await fetch(`/api/webstore/seri?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Trend verisi alınamadı (HTTP ${res.status})`);
      const envelope: ApiEnvelope<WebstoreSeri> = await res.json();
      setSeri(envelope.data);
      setSource(envelope.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [granularite, yil]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- granularite/yıl değişince trend verisini çekiyoruz
    load();
  }, [load]);

  const { baslik, aciklama } = BASLIKLAR[granularite];
  const chartData = seri?.noktalar.map((n) => ({ ...n, value: n.genelToplam })) ?? [];

  return (
    <div className="animate-rise-in flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            {baslik} Trend
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{aciklama}</p>
        </div>
        {granularite === "aylik" && (
          <select
            value={yil}
            onChange={(e) => setYil(Number(e.target.value))}
            className="rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink-soft)] outline-none"
          >
            {Array.from({ length: 6 }, (_, i) => buYil - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[var(--negative)]/25 bg-[var(--negative)]/5 px-4 py-3 text-sm text-[var(--negative)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-56 items-center justify-center gap-2 text-sm text-[var(--muted)]">
          <RefreshIcon className="h-4 w-4 animate-spin" />
          Yükleniyor...
        </div>
      ) : seri && seri.noktalar.length > 0 ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {seri.baslik} toplamı
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--ink)]">
                {formatCompactCurrency(seri.toplam)} ₺
              </p>
            </div>
            {source === "mock" && (
              <span className="rounded-full bg-[var(--brass)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--brass-strong)]">
                ○ Örnek Veri
              </span>
            )}
          </div>

          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={{ stroke: "var(--line-strong)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCompactCurrency(v)}
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell
                      key={d.key}
                      fill={d.veriAlinamadi ? "var(--line-strong)" : "var(--brass)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {!seri.kutuHesaplandi && (
            <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-2.5 text-xs text-[var(--muted)]">
              Miktar (Kutu) ve ₺/Kutu kolonları bu dönem için hesaplanamadı — ciro rakamları
              yine de gerçek ve güncel.
            </div>
          )}

          <div className="ledger-scroll max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-[var(--line)]">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="sticky top-0 bg-[var(--paper-card)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                <tr className="border-b border-[var(--line)]">
                  <th className="px-3 py-2 text-left" rowSpan={2}>
                    Dönem
                  </th>
                  <th className="border-l border-[var(--line)] px-3 py-1 text-center" colSpan={3}>
                    Kendi Site
                  </th>
                  <th className="border-l border-[var(--line)] px-3 py-1 text-center" colSpan={3}>
                    Pazaryerleri
                  </th>
                  <th className="border-l border-[var(--line)] px-3 py-2 text-right" rowSpan={2}>
                    Genel Toplam
                  </th>
                  <th className="px-3 py-2 text-right" rowSpan={2}>
                    Fatura
                  </th>
                </tr>
                <tr className="border-b border-[var(--line)]">
                  <th className="border-l border-[var(--line)] px-3 py-1.5 text-right font-normal normal-case">Ciro</th>
                  <th className="px-3 py-1.5 text-right font-normal normal-case">Kutu</th>
                  <th className="px-3 py-1.5 text-right font-normal normal-case">₺/Kutu</th>
                  <th className="border-l border-[var(--line)] px-3 py-1.5 text-right font-normal normal-case">Ciro</th>
                  <th className="px-3 py-1.5 text-right font-normal normal-case">Kutu</th>
                  <th className="px-3 py-1.5 text-right font-normal normal-case">₺/Kutu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {seri.noktalar.map((n) => (
                  <tr key={n.key} className="hover:bg-[var(--paper)]">
                    <td className="px-3 py-2 text-[var(--ink-soft)]">
                      {granularite === "yillik"
                        ? n.label
                        : granularite === "aylik"
                          ? n.label
                          : `${formatDate(n.baslangic)} – ${formatDate(n.bitis)}`}
                    </td>
                    {n.veriAlinamadi ? (
                      <td colSpan={8} className="px-3 py-2 text-right text-xs font-medium text-[var(--negative)]">
                        Veri alınamadı — FastAPI&apos;ye bu dönem için ulaşılamadı
                      </td>
                    ) : (
                      <>
                        <td className="border-l border-[var(--line)] px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCurrency(n.kendiSiteToplam)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {seri.kutuHesaplandi ? formatInteger(n.kendiSiteKutuAdedi) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {seri.kutuHesaplandi && n.ciroKutuKendiSite !== null
                            ? formatCurrency(n.ciroKutuKendiSite)
                            : "—"}
                        </td>
                        <td className="border-l border-[var(--line)] px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                          {formatCurrency(n.pazaryerleriToplam)}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {seri.kutuHesaplandi ? formatInteger(n.pazaryerleriKutuAdedi) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--muted)]">
                          {seri.kutuHesaplandi && n.ciroKutuPazaryerleri !== null
                            ? formatCurrency(n.ciroKutuPazaryerleri)
                            : "—"}
                        </td>
                        <td className="border-l border-[var(--line)] px-3 py-2 text-right font-[family-name:var(--font-mono)] font-semibold tabular-nums text-[var(--ink)]">
                          {formatCurrency(n.genelToplam)}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--muted)]">{n.genelFaturaAdedi}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
          Bu dönem için veri yok.
        </div>
      )}
    </div>
  );
}
