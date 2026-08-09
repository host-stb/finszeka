"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { ApiEnvelope } from "@/lib/types";
import { WebstoreSeri } from "@/lib/webstore-types";
import { RefreshIcon } from "./icons";

const AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

interface TooltipPayload {
  value: number | null;
  dataKey: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  yilA,
  yilB,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  yilA: number;
  yilB: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-[var(--ink)] px-3.5 py-2.5 text-[var(--paper)] shadow-lg">
      <p className="font-[family-name:var(--font-display)] text-sm">{label}</p>
      {payload.map((p) => (
        <p
          key={p.dataKey}
          className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold tabular-nums"
          style={{ color: p.color }}
        >
          {p.dataKey === "a" ? yilA : yilB}:{" "}
          {p.value === null ? "-" : `${formatCompactCurrency(p.value)} ₺`}
        </p>
      ))}
    </div>
  );
}

function YilSecici({
  value,
  onChange,
  yillar,
}: {
  value: number;
  onChange: (v: number) => void;
  yillar: number[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-full border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 text-sm text-[var(--ink-soft)] outline-none"
    >
      {yillar.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

export default function WebstoreYilKarsilastirma() {
  const buYil = new Date().getUTCFullYear();
  const [yilA, setYilA] = useState(buYil);
  const [yilB, setYilB] = useState(buYil - 1);
  const [seriA, setSeriA] = useState<WebstoreSeri | null>(null);
  const [seriB, setSeriB] = useState<WebstoreSeri | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const yillar = Array.from({ length: 7 }, (_, i) => buYil - i);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/webstore/seri?granularite=aylik&yil=${yilA}`, { cache: "no-store" }),
        fetch(`/api/webstore/seri?granularite=aylik&yil=${yilB}`, { cache: "no-store" }),
      ]);
      if (!resA.ok || !resB.ok) throw new Error("Yıl karşılaştırma verisi alınamadı");
      const envA: ApiEnvelope<WebstoreSeri> = await resA.json();
      const envB: ApiEnvelope<WebstoreSeri> = await resB.json();
      setSeriA(envA.data);
      setSeriB(envB.data);
      setSource(envA.source === "live" && envB.source === "live" ? "live" : "mock");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }, [yilA, yilB]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- yıl seçimi değişince karşılaştırmayı çekiyoruz
    load();
  }, [load]);

  const chartData = useMemo(() => {
    return AY_KISA.map((label, i) => ({
      label,
      a: seriA?.noktalar[i]?.veriAlinamadi ? null : (seriA?.noktalar[i]?.genelToplam ?? null),
      b: seriB?.noktalar[i]?.veriAlinamadi ? null : (seriB?.noktalar[i]?.genelToplam ?? null),
    }));
  }, [seriA, seriB]);

  const toplamA = seriA?.toplam ?? 0;
  const toplamB = seriB?.toplam ?? 0;
  const degisim = toplamB > 0 ? ((toplamA - toplamB) / toplamB) * 100 : null;

  return (
    <div className="animate-rise-in flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-card)] p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--ink)]">
            Yıl Yıla Karşılaştırma
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            İki yılı seçin, ay ay ciro (KDV dahil) yan yana karşılaştırılsın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YilSecici value={yilA} onChange={setYilA} yillar={yillar} />
          <span className="text-xs text-[var(--muted)]">vs</span>
          <YilSecici value={yilB} onChange={setYilB} yillar={yillar} />
        </div>
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
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {yilA} toplamı
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xl font-semibold tabular-nums text-[var(--ink)]">
                {formatCompactCurrency(toplamA)} ₺
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {yilB} toplamı
              </p>
              <p className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-[var(--ink-soft)]">
                {formatCompactCurrency(toplamB)} ₺
                <span
                  className={`ml-2 text-xs font-medium ${
                    degisim !== null && degisim >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}
                >
                  {formatPercent(degisim)}
                </span>
              </p>
            </div>
            {source === "mock" && (
              <span className="rounded-full bg-[var(--brass)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--brass-strong)]">
                ○ Örnek Veri
              </span>
            )}
          </div>

          <div className="h-64 w-full sm:h-72">
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
                <Tooltip content={<ChartTooltip yilA={yilA} yilB={yilB} />} cursor={{ fill: "var(--line)", opacity: 0.4 }} />
                <Legend formatter={(value) => (value === "a" ? String(yilA) : String(yilB))} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="a" fill="var(--brass)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="b" fill="var(--line-strong)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
