"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { ApiEnvelope } from "@/lib/types";
import { WebstoreGunlukSeri } from "@/lib/webstore-types";
import { CalendarIcon, RefreshIcon } from "./icons";

function bugunAyDegeri(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface ChartRow {
  gun: number;
  guncel: number | null;
  gecenYil: number | null;
}

interface TooltipPayload {
  value: number | null;
  dataKey: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  guncelEtiket,
  gecenYilEtiket,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
  guncelEtiket: string;
  gecenYilEtiket?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">Gün {label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums"
          style={{ color: p.color }}
        >
          {p.dataKey === "guncel" ? guncelEtiket : gecenYilEtiket}:{" "}
          {p.value === null ? "-" : `${formatCompactCurrency(p.value)} ₺`}
        </p>
      ))}
    </div>
  );
}

export default function WebstoreDailyBreakdown() {
  const [ayDegeri, setAyDegeri] = useState(bugunAyDegeri());
  const [seri, setSeri] = useState<WebstoreGunlukSeri | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (deger: string) => {
    setLoading(true);
    setError(null);
    try {
      const [yil, ay] = deger.split("-").map(Number);
      const res = await fetch(`/api/webstore/gunluk?yil=${yil}&ay=${ay}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Günlük veri alınamadı (HTTP ${res.status})`);
      const envelope: ApiEnvelope<WebstoreGunlukSeri> = await res.json();
      setSeri(envelope.data);
      setSource(envelope.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ay değişince günlük seriyi çekiyoruz
    load(ayDegeri);
  }, [ayDegeri, load]);

  const chartData: ChartRow[] = useMemo(() => {
    if (!seri) return [];
    const gunSayisi = Math.max(
      seri.gunler.length,
      seri.gecenYilAyniAy?.gunler.length ?? 0
    );
    return Array.from({ length: gunSayisi }, (_, i) => ({
      gun: i + 1,
      guncel: seri.gunler[i]?.genelToplam ?? null,
      gecenYil: seri.gecenYilAyniAy?.gunler[i]?.genelToplam ?? null,
    }));
  }, [seri]);

  const degisimYuzde =
    seri?.gecenYilAyniAy && seri.gecenYilAyniAy.toplam > 0
      ? ((seri.toplam - seri.gecenYilAyniAy.toplam) / seri.gecenYilAyniAy.toplam) * 100
      : null;

  return (
    <div className="animate-rise-in flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            Günlük Detay
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Bir ay seçin — gün gün ciro (KDV dahil), geçen yılın aynı ayıyla kıyaslamalı.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink-soft)]">
          <CalendarIcon className="h-4 w-4 text-[var(--muted)]" />
          <input
            type="month"
            value={ayDegeri}
            max={bugunAyDegeri()}
            onChange={(e) => setAyDegeri(e.target.value)}
            className="bg-transparent outline-none [color-scheme:light]"
          />
        </label>
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
      ) : seri && seri.gunler.length > 0 ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {seri.ayEtiketi} toplamı
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--ink)]">
                {formatCompactCurrency(seri.toplam)} ₺
              </p>
            </div>
            {seri.gecenYilAyniAy && (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {seri.gecenYilAyniAy.ayEtiketi}
                </p>
                <p className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--ink-soft)]">
                  {formatCompactCurrency(seri.gecenYilAyniAy.toplam)} ₺
                  <span
                    className={`ml-2 text-xs font-medium ${
                      degisimYuzde !== null && degisimYuzde >= 0
                        ? "text-[var(--positive)]"
                        : "text-[var(--negative)]"
                    }`}
                  >
                    {formatPercent(degisimYuzde)}
                  </span>
                </p>
              </div>
            )}
            {source === "mock" && (
              <span className="rounded-full bg-[var(--brass)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--brass-strong)]">
                ○ Örnek Veri
              </span>
            )}
          </div>

          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="gun"
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
                <Tooltip
                  content={
                    <ChartTooltip
                      guncelEtiket={seri.ayEtiketi}
                      gecenYilEtiket={seri.gecenYilAyniAy?.ayEtiketi}
                    />
                  }
                />
                <Legend
                  formatter={(value) =>
                    value === "guncel" ? seri.ayEtiketi : (seri.gecenYilAyniAy?.ayEtiketi ?? "Geçen yıl")
                  }
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="guncel"
                  stroke="var(--brass)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--brass-strong)" }}
                  connectNulls
                />
                {seri.gecenYilAyniAy && (
                  <Line
                    type="monotone"
                    dataKey="gecenYil"
                    stroke="var(--muted)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="ledger-scroll max-h-72 overflow-y-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--paper-card)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                <tr className="border-b border-[var(--line)]">
                  <th className="px-3 py-2 text-left">Tarih</th>
                  <th className="px-3 py-2 text-right">Kendi Site</th>
                  <th className="px-3 py-2 text-right">Pazaryerleri</th>
                  <th className="px-3 py-2 text-right">Genel Toplam</th>
                  <th className="px-3 py-2 text-right">Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {seri.gunler.map((g) => (
                  <tr key={g.tarih} className="hover:bg-[var(--paper)]">
                    <td className="px-3 py-2 text-[var(--ink-soft)]">{formatDate(g.tarih)}</td>
                    <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                      {formatCurrency(g.kendiSiteToplam)}
                    </td>
                    <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular-nums text-[var(--ink)]">
                      {formatCurrency(g.pazaryerleriToplam)}
                    </td>
                    <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] font-semibold tabular-nums text-[var(--ink)]">
                      {formatCurrency(g.genelToplam)}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--muted)]">{g.faturaAdedi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
          Bu ay için veri yok.
        </div>
      )}
    </div>
  );
}
